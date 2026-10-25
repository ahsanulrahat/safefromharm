"use server";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { localePath } from "@/i18n/locale-path";
import { prisma } from "@/lib/prisma";
import { normalizeEmail, normalizePhone, normalizeScoutId } from "@/lib/ids";
import { resumeWithCodeSchema, resumeWithIdSchema } from "@/lib/validation";
import { clearParticipantSession, setParticipantSession } from "@/lib/participant-session";
import { getClientIp } from "@/lib/request";
import { rateLimit } from "@/lib/rate-limit";

export type ResumeState = { error?: string };

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function guard(locale: string) {
  const t = await getTranslations({ locale, namespace: "validation" });
  const ip = await getClientIp();
  const limited = await rateLimit(`resume:${ip}`, 12, 10 * 60_000);
  return { t, limited };
}

export async function resumeWithCodeAction(
  _prev: ResumeState,
  formData: FormData
): Promise<ResumeState> {
  const locale = text(formData, "locale") === "en" ? "en" : "bn";
  const { t, limited } = await guard(locale);
  if (!limited.success) return { error: t("rateLimited") };

  const parsed = resumeWithCodeSchema({
    needIdentifier: t("needIdentifier"),
    notFound: t("notFound"),
  }).safeParse({ code: text(formData, "code") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("needIdentifier") };
  }

  const code = parsed.data.code.toUpperCase();
  const participant = await prisma.participant.findUnique({
    where: { resumeCode: code },
    select: { id: true },
  });
  if (!participant) return { error: t("notFound") };

  await setParticipantSession(participant.id);
  redirect(localePath(locale, "/course"));
}

export async function resumeWithIdAction(
  _prev: ResumeState,
  formData: FormData
): Promise<ResumeState> {
  const locale = text(formData, "locale") === "en" ? "en" : "bn";
  const { t, limited } = await guard(locale);
  if (!limited.success) return { error: t("rateLimited") };

  const parsed = resumeWithIdSchema({
    needIdentifier: t("needIdentifier"),
    notFound: t("notFound"),
  }).safeParse({
    scoutId: text(formData, "scoutId"),
    contact: text(formData, "contact"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? t("needIdentifier") };
  }

  const scoutId = normalizeScoutId(parsed.data.scoutId);
  const contact = parsed.data.contact.trim();
  const isEmail = contact.includes("@");
  const participant = await prisma.participant.findFirst({
    where: {
      scoutId,
      OR: isEmail
        ? [{ email: normalizeEmail(contact) }]
        : [{ phone: normalizePhone(contact) }],
    },
    select: { id: true },
  });
  if (!participant) return { error: t("notFound") };

  await setParticipantSession(participant.id);
  redirect(localePath(locale, "/course"));
}

export async function signOutParticipantAction(formData: FormData) {
  const locale = text(formData, "locale") === "en" ? "en" : "bn";
  await clearParticipantSession();
  redirect(localePath(locale, "/"));
}
