"use server";

import { Prisma } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { registrationSchema } from "@/lib/validation";
import { newResumeCode, normalizeEmail, normalizePhone, normalizeScoutId } from "@/lib/ids";
import { setParticipantSession } from "@/lib/participant-session";
import { getClientIp } from "@/lib/request";
import { rateLimit } from "@/lib/rate-limit";
import { safeErrorDetails } from "@/lib/safe-log";

export type RegisterState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
  ok?: boolean;
};

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function registerAction(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const locale = text(formData, "locale") === "en" ? "en" : "bn";
  const t = await getTranslations({ locale, namespace: "validation" });

  const ip = await getClientIp();
  const limited = await rateLimit(`register:${ip}`, 10, 10 * 60_000);
  if (!limited.success) return { error: t("rateLimited") };

  // Honeypot: bots fill hidden fields.
  if (text(formData, "website")) return { error: t("generic") };

  const raw = {
    fullNameBn: text(formData, "fullNameBn"),
    nameEn: text(formData, "nameEn"),
    scoutId: text(formData, "scoutId"),
    unit: text(formData, "unit"),
    district: text(formData, "district"),
    memberType: text(formData, "memberType"),
    phone: text(formData, "phone").trim() || undefined,
    email: text(formData, "email").trim() || undefined,
    isMinor: formData.get("isMinor") === "on",
    guardianConsent: formData.get("guardianConsent") === "on",
    consent: formData.get("consent") === "on",
  };

  const values: Record<string, string> = {
    fullNameBn: raw.fullNameBn,
    nameEn: raw.nameEn,
    scoutId: raw.scoutId,
    unit: raw.unit,
    district: raw.district,
    memberType: raw.memberType,
    phone: raw.phone ?? "",
    email: raw.email ?? "",
    isMinor: raw.isMinor ? "on" : "",
    guardianConsent: raw.guardianConsent ? "on" : "",
    consent: raw.consent ? "on" : "",
  };

  const schema = registrationSchema({
    fullNameBn: t("fullNameBn"),
    nameEn: t("nameEn"),
    nameEnLatin: t("nameEnLatin"),
    scoutId: t("scoutId"),
    unit: t("unit"),
    district: t("district"),
    memberType: t("memberType"),
    phone: t("phone"),
    email: t("email"),
    contact: t("contact"),
    consent: t("consent"),
    guardian: t("guardian"),
  });

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { fieldErrors, values };
  }

  const data = parsed.data;
  const scoutId = normalizeScoutId(data.scoutId);
  const phone = data.phone ? normalizePhone(data.phone) : undefined;
  const email = data.email ? normalizeEmail(data.email) : undefined;

  const duplicate = await prisma.participant.findFirst({
    where: {
      OR: [
        { scoutId },
        ...(phone ? [{ phone }] : []),
      ],
    },
    select: { scoutId: true, phone: true },
  });

  if (duplicate) {
    const isScoutDuplicate = duplicate.scoutId === scoutId;
    return {
      error: isScoutDuplicate ? t("duplicateScout") : t("duplicatePhone"),
      fieldErrors: {
        [isScoutDuplicate ? "scoutId" : "phone"]: isScoutDuplicate
          ? t("duplicateScout")
          : t("duplicatePhone"),
      },
      values,
    };
  }

  let participantId: string;
  try {
    const participant = await prisma.participant.create({
      data: {
        fullNameBn: data.fullNameBn,
        nameEn: data.nameEn,
        scoutId,
        unit: data.unit,
        district: data.district,
        audience: data.memberType,
        phone: phone ?? null,
        email: email ?? null,
        isMinor: data.isMinor,
        guardianConsent: data.isMinor ? data.guardianConsent : false,
        consentAt: new Date(),
        resumeCode: newResumeCode(),
      },
      select: { id: true },
    });
    participantId = participant.id;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(",")
        : String(error.meta?.target ?? "");
      const isPhone = target.includes("phone");
      return {
        error: isPhone ? t("duplicatePhone") : t("duplicateScout"),
        fieldErrors: {
          [isPhone ? "phone" : "scoutId"]: isPhone
            ? t("duplicatePhone")
            : t("duplicateScout"),
        },
        values,
      };
    }
    console.error("Registration failed", safeErrorDetails(error));
    return { error: t("generic"), values };
  }

  await setParticipantSession(participantId);
  redirect(`/${locale}/registered`);
}
