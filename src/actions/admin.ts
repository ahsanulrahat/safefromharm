"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { localePath } from "@/i18n/locale-path";
import { prisma } from "@/lib/prisma";
import { requireAdminAction } from "@/lib/admin";
import { audit } from "@/lib/audit";
import { contentModuleSchema } from "@/lib/validation";
import { reissueCertificate } from "@/lib/certificates";
import { safeErrorDetails } from "@/lib/safe-log";

export type ContentState = { error?: string; fieldErrors?: string[] };

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/* -------------------------------------------------------------------------- */
/* Content management                                                         */
/* -------------------------------------------------------------------------- */

export async function saveModuleAction(
  _prev: ContentState,
  formData: FormData
): Promise<ContentState> {
  const admin = await requireAdminAction(["SUPERADMIN", "SAFEGUARDING"]);
  const raw = text(formData, "json");
  const originalSlug = text(formData, "originalSlug").trim();

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return { error: "Invalid JSON. Check for missing commas or quotes." };
  }

  const parsed = contentModuleSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return {
      error: "The content did not validate.",
      fieldErrors: parsed.error.issues.map(
        (issue) => `${issue.path.join(".") || "module"}: ${issue.message}`
      ),
    };
  }

  const data = parsed.data;

  if (!originalSlug) {
    const existing = await prisma.module.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });
    if (existing) {
      return { error: `A module with slug “${data.slug}” already exists.` };
    }
  }

  try {
    const savedModule = await prisma.$transaction(
      async (tx) => {
        const moduleData = {
          titleBn: data.titleBn,
          titleEn: data.titleEn,
          descriptionBn: data.descriptionBn,
          descriptionEn: data.descriptionEn,
          videoId: data.videoId,
          passMark: data.passMark ?? null,
          published: data.published,
        };

        const saved = originalSlug
          ? await tx.module.update({
              where: { slug: originalSlug },
              data: moduleData,
            })
          : await tx.module.create({
              data: {
                slug: data.slug,
                audience: data.audience,
                order:
                  ((
                    await tx.module.aggregate({ _max: { order: true } })
                  )._max.order ?? 0) + 1,
                ...moduleData,
              },
            });

        const existingSteps = await tx.step.findMany({
          where: { moduleId: saved.id },
          select: { id: true },
        });
        const existingIds = new Set(existingSteps.map((s) => s.id));
        const incomingIds = new Set(
          data.steps.flatMap((step) => (step.id ? [step.id] : []))
        );

        const toDelete = existingSteps
          .filter((step) => !incomingIds.has(step.id))
          .map((step) => step.id);
        if (toDelete.length > 0) {
          await tx.step.deleteMany({ where: { id: { in: toDelete } } });
        }

        // Move existing orders out of the way before applying 0..n.
        if (existingSteps.length > 0) {
          await tx.step.updateMany({
            where: { moduleId: saved.id },
            data: { order: { increment: 10_000 } },
          });
        }

        for (const [index, step] of data.steps.entries()) {
          const payload = {
            moduleId: saved.id,
            order: index,
            type: step.type,
            promptBn: step.promptBn,
            promptEn: step.promptEn,
            options:
              step.type === "MCQ"
                ? (step.options as unknown as Prisma.InputJsonValue)
                : Prisma.JsonNull,
            correctOptionId:
              step.type === "MCQ" ? (step.correctOptionId ?? null) : null,
            minWords: step.type === "REFLECTION" ? step.minWords : 30,
          };

          if (step.id && existingIds.has(step.id)) {
            await tx.step.update({ where: { id: step.id }, data: payload });
          } else if (step.id) {
            await tx.step.create({ data: { id: step.id, ...payload } });
          } else {
            await tx.step.create({ data: payload });
          }
        }

        return saved;
      },
      { timeout: 15_000 }
    );

    await audit({
      actorEmail: admin.email,
      actorRole: admin.role,
      action: originalSlug ? "CONTENT_UPDATE" : "CONTENT_CREATE",
      targetType: "Module",
      targetId: savedModule.slug,
    });

    revalidatePath("/[locale]/course", "page");
    revalidatePath("/[locale]/course/[moduleSlug]", "page");
    revalidatePath("/[locale]/admin/content", "page");
    redirect(`/${text(formData, "locale") || "bn"}/admin/content?module=${savedModule.slug}&saved=1`);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "A slug or step id in this JSON is already in use." };
    }
    // Let Next.js redirects through untouched.
    if (
      error instanceof Error &&
      (error.message === "NEXT_REDIRECT" || "digest" in error)
    ) {
      throw error;
    }
    console.error("saveModule failed", safeErrorDetails(error));
    return { error: "Could not save the module. Please try again." };
  }
}

export async function moveModuleAction(formData: FormData) {
  const admin = await requireAdminAction(["SUPERADMIN", "SAFEGUARDING"]);
  const slug = text(formData, "slug");
  const direction = text(formData, "direction") === "up" ? "up" : "down";
  const locale = text(formData, "locale") || "bn";

  const existingModule = await prisma.module.findUnique({ where: { slug } });
  if (!existingModule) redirect(localePath(locale, "/admin/content"));

  const neighbour = await prisma.module.findFirst({
    where: {
      order:
        direction === "up" ? { lt: existingModule.order } : { gt: existingModule.order },
    },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
  });

  if (neighbour) {
    await prisma.$transaction([
      prisma.module.update({
        where: { id: existingModule.id },
        data: { order: neighbour.order },
      }),
      prisma.module.update({
        where: { id: neighbour.id },
        data: { order: existingModule.order },
      }),
    ]);
  }

  await audit({
    actorEmail: admin.email,
    actorRole: admin.role,
    action: "CONTENT_REORDER",
    targetType: "Module",
    targetId: slug,
  });

  revalidatePath("/[locale]/course", "page");
  revalidatePath("/[locale]/admin/content", "page");
  redirect(`${localePath(locale, "/admin/content")}?module=${encodeURIComponent(slug)}`);
}

export async function togglePublishAction(formData: FormData) {
  const admin = await requireAdminAction(["SUPERADMIN", "SAFEGUARDING"]);
  const slug = text(formData, "slug");
  const locale = text(formData, "locale") || "bn";

  const existingModule = await prisma.module.findUnique({ where: { slug } });
  if (existingModule) {
    await prisma.module.update({
      where: { id: existingModule.id },
      data: { published: !existingModule.published },
    });
    await audit({
      actorEmail: admin.email,
      actorRole: admin.role,
      action: existingModule.published ? "CONTENT_UNPUBLISH" : "CONTENT_PUBLISH",
      targetType: "Module",
      targetId: slug,
    });
  }

  revalidatePath("/[locale]/course", "page");
  revalidatePath("/[locale]/admin/content", "page");
  redirect(`${localePath(locale, "/admin/content")}?module=${encodeURIComponent(slug)}`);
}

export async function saveSettingsAction(formData: FormData) {
  const admin = await requireAdminAction(["SUPERADMIN"]);
  const locale = text(formData, "locale") || "bn";
  const value = Number.parseInt(text(formData, "passMark"), 10);

  if (Number.isFinite(value) && value >= 0 && value <= 100) {
    await prisma.setting.upsert({
      where: { key: "mcqPassMark" },
      create: { key: "mcqPassMark", value: String(value) },
      update: { value: String(value) },
    });
    await audit({
      actorEmail: admin.email,
      actorRole: admin.role,
      action: "SETTING_UPDATE",
      targetType: "Setting",
      targetId: "mcqPassMark",
    });
  }

  revalidatePath("/[locale]/admin/content", "page");
  revalidatePath("/[locale]/course", "page");
  redirect(`${localePath(locale, "/admin/content")}?saved=1`);
}

/* -------------------------------------------------------------------------- */
/* Certificates                                                               */
/* -------------------------------------------------------------------------- */

export async function revokeCertificateAction(formData: FormData) {
  const admin = await requireAdminAction(["SUPERADMIN"]);
  const id = text(formData, "id").toUpperCase();
  const locale = text(formData, "locale") || "bn";
  const reason = text(formData, "reason").trim() || "Revoked by organizer";

  const certificate = await prisma.certificate.findUnique({ where: { id } });
  if (certificate && !certificate.revokedAt) {
    await prisma.certificate.update({
      where: { id },
      data: {
        revokedAt: new Date(),
        revokedReason: reason,
        activeKey: null,
      },
    });
    await audit({
      actorEmail: admin.email,
      actorRole: admin.role,
      action: "CERTIFICATE_REVOKE",
      targetType: "Certificate",
      targetId: id,
    });
  }

  revalidatePath("/[locale]/admin/certificates", "page");
  redirect(localePath(locale, "/admin/certificates"));
}

export async function reissueCertificateAction(formData: FormData) {
  const admin = await requireAdminAction(["SUPERADMIN"]);
  const id = text(formData, "id").toUpperCase();
  const locale = text(formData, "locale") || "bn";

  const certificate = await prisma.certificate.findUnique({ where: { id } });
  if (certificate) {
    const created = await reissueCertificate(certificate.participantId, id);
    await audit({
      actorEmail: admin.email,
      actorRole: admin.role,
      action: "CERTIFICATE_REISSUE",
      targetType: "Certificate",
      targetId: created.id,
    });
  }

  revalidatePath("/[locale]/admin/certificates", "page");
  revalidatePath("/[locale]/certificate", "page");
  redirect(localePath(locale, "/admin/certificates"));
}
