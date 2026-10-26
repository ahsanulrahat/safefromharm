"use server";

import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { localePath } from "@/i18n/locale-path";
import { prisma } from "@/lib/prisma";
import { requireAdminAction } from "@/lib/admin";
import { audit } from "@/lib/audit";
import { contentModuleSchema } from "@/lib/validation";
import { hasCompleteTranslations, sanitizeRichText } from "@/lib/content";
import { reissueCertificate } from "@/lib/certificates";
import { safeErrorDetails } from "@/lib/safe-log";
import { rateLimit } from "@/lib/rate-limit";
import { getPassMark } from "@/lib/settings";

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
  const admin = await requireAdminAction("content:write");
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

  const data = {
    ...parsed.data,
    writtenBn: sanitizeRichText(parsed.data.writtenBn),
    writtenEn: sanitizeRichText(parsed.data.writtenEn),
    steps: parsed.data.steps.map((step) => ({
      ...step,
      id: step.id ?? randomUUID(),
      explanationBn: sanitizeRichText(step.explanationBn),
      explanationEn: sanitizeRichText(step.explanationEn),
    })),
  };

  try {
    const savedModule = await prisma.$transaction(async (tx) => {
      const current = originalSlug
        ? await tx.module.findUnique({ where: { slug: originalSlug } })
        : null;
      if (originalSlug && !current) throw new Error("MODULE_NOT_FOUND");
      if (current && current.audience !== data.audience) throw new Error("TRACK_CHANGE_NOT_ALLOWED");
      if (!current && await tx.module.findUnique({ where: { slug: data.slug }, select: { id: true } })) {
        throw new Error("DUPLICATE_SLUG");
      }

      const contentModule = current ?? await tx.module.create({
        data: {
          slug: data.slug,
          audience: data.audience,
          order: ((await tx.module.aggregate({ where: { audience: data.audience }, _max: { order: true } }))._max.order ?? -1) + 1,
          titleBn: data.titleBn,
          titleEn: data.titleEn,
          descriptionBn: data.descriptionBn,
          descriptionEn: data.descriptionEn,
          writtenBn: data.writtenBn,
          writtenEn: data.writtenEn,
          videoId: data.videoId,
          mustWatch: data.mustWatch,
          attemptsAllowed: data.attemptsAllowed,
          paragraphApprovalRequired: data.paragraphApprovalRequired,
          passMark: data.passMark ?? null,
          published: false,
        },
      });
      const latestVersion = await tx.moduleContentVersion.aggregate({ where: { moduleId: contentModule.id }, _max: { version: true } });
      const version = await tx.moduleContentVersion.create({
        data: {
          moduleId: contentModule.id,
          version: (latestVersion._max.version ?? 0) + 1,
          status: "DRAFT",
          snapshot: data as Prisma.InputJsonValue,
          createdById: admin.id,
        },
      });
      await audit({
        tx,
        required: true,
        actorId: admin.id,
        actorEmail: admin.email,
        actorRole: admin.role,
        action: current ? "CONTENT_DRAFT_SAVE" : "CONTENT_DRAFT_CREATE",
        targetType: "ModuleContentVersion",
        targetId: version.id,
        before: current ? { moduleId: contentModule.id, currentVersion: latestVersion._max.version ?? null } : null,
        after: { moduleId: contentModule.id, version: version.version, status: version.status },
      });
      return contentModule;
    }, { timeout: 15_000, isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    revalidatePath("/[locale]/admin/content", "page");
    const locale = text(formData, "locale") === "en" ? "en" : "bn";
    redirect(`${localePath(locale, "/admin/content")}?module=${encodeURIComponent(savedModule.slug)}&saved=1`);
  } catch (error) {
    if (error instanceof Error && error.message === "DUPLICATE_SLUG") {
      return { error: `A module with slug “${data.slug}” already exists.` };
    }
    if (error instanceof Error && error.message === "TRACK_CHANGE_NOT_ALLOWED") {
      return { error: "A module cannot be moved between Rover and Leader tracks after creation." };
    }
    if (error instanceof Error && error.message === "MODULE_NOT_FOUND") {
      return { error: "The module no longer exists. Refresh the page and try again." };
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2002" || error.code === "P2034")
    ) {
      return { error: "The draft changed at the same time as another edit. Refresh and try again." };
    }
    // Let Next.js redirects through untouched.
    if (
      error instanceof Error &&
      (error.message === "NEXT_REDIRECT" || "digest" in error)
    ) {
      throw error;
    }
    console.error("saveModuleDraft failed", safeErrorDetails(error));
    return { error: "Could not save the draft. Please try again." };
  }
}

/** Publish a draft or restore an older published snapshot as a new version. */
export async function publishModuleVersionAction(formData: FormData) {
  const admin = await requireAdminAction("content:write");
  const locale = text(formData, "locale") === "en" ? "en" : "bn";
  const versionId = text(formData, "versionId").trim();
  const mode = text(formData, "mode") === "rollback" ? "rollback" : "publish";
  const password = formData.get("currentPassword");
  const reauthLimit = await rateLimit(`admin-reauth:${admin.id}`, 8, 10 * 60_000);
  const passwordRow = await prisma.adminUser.findUnique({
    where: { id: admin.id },
    select: { passwordHash: true },
  });
  if (!reauthLimit.success || !passwordRow || typeof password !== "string" || !password || !await bcrypt.compare(password, passwordRow.passwordHash)) {
    redirect(`${localePath(locale, "/admin/content")}?error=reauth`);
  }

  const sourceVersion = await prisma.moduleContentVersion.findUnique({
    where: { id: versionId },
    include: { module: true },
  });
  if (!sourceVersion || (mode === "publish" && sourceVersion.status !== "DRAFT") || (mode === "rollback" && sourceVersion.status !== "ARCHIVED")) {
    redirect(`${localePath(locale, "/admin/content")}?error=version`);
  }
  const parsed = contentModuleSchema.safeParse(sourceVersion.snapshot);
  if (!parsed.success || !hasCompleteTranslations(parsed.data)) {
    redirect(`${localePath(locale, "/admin/content")}?module=${encodeURIComponent(sourceVersion.module.slug)}&error=translations`);
  }
  const content = {
    ...parsed.data,
    // Keep null in the content snapshot when the module inherits the global
    // pass mark. The effective value is versioned separately at publish time.
    passMark: parsed.data.passMark ?? null,
    writtenBn: sanitizeRichText(parsed.data.writtenBn),
    writtenEn: sanitizeRichText(parsed.data.writtenEn),
    steps: parsed.data.steps.map((step) => ({
      ...step,
      id: step.id ?? randomUUID(),
      explanationBn: sanitizeRichText(step.explanationBn),
      explanationEn: sanitizeRichText(step.explanationEn),
    })),
  };
  const effectivePassMark = mode === "rollback"
    ? sourceVersion.effectivePassMark
    : content.passMark ?? await getPassMark();

  const slugCollision = await prisma.module.findUnique({ where: { slug: content.slug }, select: { id: true } });
  if (slugCollision && slugCollision.id !== sourceVersion.moduleId) {
    redirect(`${localePath(locale, "/admin/content")}?module=${encodeURIComponent(sourceVersion.module.slug)}&error=slug`);
  }

  try {
    await prisma.$transaction(async (tx) => {
    const contentModule = await tx.module.findUnique({ where: { id: sourceVersion.moduleId } });
    if (!contentModule) throw new Error("MODULE_NOT_FOUND");
    if (contentModule.audience !== content.audience) throw new Error("TRACK_CHANGE_NOT_ALLOWED");
    const currentPublished = await tx.moduleContentVersion.findFirst({
      where: { moduleId: contentModule.id, status: "PUBLISHED" },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    let targetVersionId = sourceVersion.id;
    let targetVersionNumber = sourceVersion.version;
    if (mode === "rollback") {
      const latest = await tx.moduleContentVersion.aggregate({ where: { moduleId: contentModule.id }, _max: { version: true } });
      const rollbackDraft = await tx.moduleContentVersion.create({
        data: {
          moduleId: contentModule.id,
          version: (latest._max.version ?? 0) + 1,
          status: "DRAFT",
          snapshot: content as Prisma.InputJsonValue,
          effectivePassMark,
          createdById: admin.id,
        },
      });
      targetVersionId = rollbackDraft.id;
      targetVersionNumber = rollbackDraft.version;
    }

    const existingSteps = await tx.step.findMany({
      where: { moduleId: contentModule.id },
    });
    const existingById = new Map(existingSteps.map((step) => [step.id, step]));
    for (const step of content.steps) {
      const existing = existingById.get(step.id);
      if (!existing && await tx.step.findUnique({ where: { id: step.id }, select: { moduleId: true } })) {
        throw new Error("STEP_ID_CONFLICT");
      }
    }
    const incomingIds = new Set(content.steps.map((step) => step.id));
    const removedSteps = existingSteps.filter((step) => !incomingIds.has(step.id));
    for (const removed of removedSteps) {
      // Old published snapshots can still reference this question for a
      // learner pinned to that version, even if they have not answered it yet.
      await tx.step.update({ where: { id: removed.id }, data: { archivedAt: new Date() } });
    }
    await tx.step.updateMany({ where: { moduleId: contentModule.id }, data: { order: { increment: 1_000 } } });

    await tx.module.update({
      where: { id: contentModule.id },
      data: {
        slug: content.slug,
        titleBn: content.titleBn,
        titleEn: content.titleEn,
        descriptionBn: content.descriptionBn,
        descriptionEn: content.descriptionEn,
        writtenBn: content.writtenBn,
        writtenEn: content.writtenEn,
        videoId: content.videoId,
        mustWatch: content.mustWatch,
        attemptsAllowed: content.attemptsAllowed,
        paragraphApprovalRequired: content.paragraphApprovalRequired,
        passMark: content.passMark ?? null,
        published: true,
      },
    });
    for (const [index, step] of content.steps.entries()) {
      const type = step.type;
      const options = step.options?.length ? step.options as unknown as Prisma.InputJsonValue : Prisma.JsonNull;
      const payload = {
        moduleId: contentModule.id,
        order: index,
        type,
        promptBn: step.promptBn,
        promptEn: step.promptEn,
        options,
        correctOptionId: type === "MCQ" || type === "SCENARIO" ? step.correctOptionId ?? null : null,
        correctOptionIds: type === "MULTI_SELECT" ? step.correctOptionIds as Prisma.InputJsonValue : Prisma.JsonNull,
        minWords: type === "REFLECTION" || type === "PARAGRAPH" ? step.minWords : 30,
        explanationBn: step.explanationBn,
        explanationEn: step.explanationEn,
        points: step.points,
        archivedAt: null,
      };
      const existing = existingById.get(step.id);
      if (existing) await tx.step.update({ where: { id: step.id }, data: payload });
      else await tx.step.create({ data: { id: step.id, ...payload } });
    }
    await tx.stepProgress.updateMany({
      where: { moduleId: contentModule.id, contentVersionId: null },
      data: { contentVersionId: targetVersionId },
    });
    await tx.moduleContentVersion.updateMany({
      where: { moduleId: contentModule.id, status: "PUBLISHED" },
      data: { status: "ARCHIVED" },
    });
    await tx.moduleContentVersion.update({
      where: { id: targetVersionId },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        createdById: admin.id,
        effectivePassMark,
      },
    });
    await audit({
      tx,
      required: true,
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: mode === "rollback" ? "CONTENT_ROLLBACK_PUBLISH" : "CONTENT_PUBLISH",
      targetType: "Module",
      targetId: content.slug,
      before: { publishedVersion: currentPublished?.version ?? null, slug: contentModule.slug },
      after: { publishedVersion: targetVersionNumber, slug: content.slug, effectivePassMark },
    });
    }, { timeout: 20_000, isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  } catch (error) {
    if (error instanceof Error && error.message === "STEP_ID_CONFLICT") {
      redirect(`${localePath(locale, "/admin/content")}?module=${encodeURIComponent(sourceVersion.module.slug)}&error=step-id`);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2002" || error.code === "P2034")) {
      redirect(`${localePath(locale, "/admin/content")}?module=${encodeURIComponent(sourceVersion.module.slug)}&error=conflict`);
    }
    console.error("publishModuleVersion failed", safeErrorDetails(error));
    redirect(`${localePath(locale, "/admin/content")}?module=${encodeURIComponent(sourceVersion.module.slug)}&error=publish`);
  }

  revalidatePath("/[locale]/course", "page");
  revalidatePath("/[locale]/course/[moduleSlug]", "page");
  revalidatePath("/[locale]/admin/content", "page");
  redirect(`${localePath(locale, "/admin/content")}?module=${encodeURIComponent(content.slug)}&published=1`);
}

export async function moveModuleAction(formData: FormData) {
  const admin = await requireAdminAction("content:write");
  const slug = text(formData, "slug");
  const direction = text(formData, "direction") === "up" ? "up" : "down";
  const locale = text(formData, "locale") || "bn";

  const existingModule = await prisma.module.findUnique({ where: { slug } });
  if (!existingModule) redirect(localePath(locale, "/admin/content"));

  const neighbour = await prisma.module.findFirst({
    where: {
      audience: existingModule.audience,
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

export async function saveSettingsAction(formData: FormData) {
  const admin = await requireAdminAction("settings:write");
  const locale = text(formData, "locale") || "bn";
  const password = formData.get("currentPassword");
  const reauthLimit = await rateLimit(`admin-reauth:${admin.id}`, 8, 10 * 60_000);
  const passwordRow = await prisma.adminUser.findUnique({ where: { id: admin.id }, select: { passwordHash: true } });
  if (!reauthLimit.success || !passwordRow || typeof password !== "string" || !password || !await bcrypt.compare(password, passwordRow.passwordHash)) {
    redirect(`${localePath(locale, "/admin/content")}?error=reauth-settings`);
  }
  const value = Number.parseInt(text(formData, "passMark"), 10);

  if (!Number.isFinite(value) || value < 0 || value > 100) {
    redirect(`${localePath(locale, "/admin/content")}?error=pass-mark`);
  }
  await prisma.$transaction(async (tx) => {
    const before = await tx.setting.findUnique({ where: { key: "mcqPassMark" }, select: { value: true } });
    await tx.setting.upsert({
      where: { key: "mcqPassMark" },
      create: { key: "mcqPassMark", value: String(value) },
      update: { value: String(value) },
    });
    const inheritingModules = await tx.module.findMany({
      where: { published: true, passMark: null },
      select: {
        id: true,
        versions: {
          where: { status: "PUBLISHED" },
          orderBy: { version: "desc" },
          take: 1,
          select: { id: true, version: true, snapshot: true },
        },
      },
    });
    let versionedModuleCount = 0;
    for (const courseModule of inheritingModules) {
      const publishedVersion = courseModule.versions[0];
      if (!publishedVersion) continue;
      const snapshot = publishedVersion.snapshot;
      const latest = await tx.moduleContentVersion.aggregate({
        where: { moduleId: courseModule.id },
        _max: { version: true },
      });
      await tx.moduleContentVersion.update({
        where: { id: publishedVersion.id },
        data: { status: "ARCHIVED" },
      });
      await tx.moduleContentVersion.create({
        data: {
          moduleId: courseModule.id,
          version: (latest._max.version ?? publishedVersion.version) + 1,
          status: "PUBLISHED",
          snapshot: snapshot as Prisma.InputJsonValue,
          effectivePassMark: value,
          createdById: admin.id,
          publishedAt: new Date(),
        },
      });
      versionedModuleCount += 1;
    }
    await audit({
      tx,
      required: true,
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: "SETTING_UPDATE",
      targetType: "Setting",
      targetId: "mcqPassMark",
      before: { value: before?.value ?? null },
      after: { value, versionedModuleCount },
    });
  }, { timeout: 20_000, isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  revalidatePath("/[locale]/admin/content", "page");
  revalidatePath("/[locale]/course", "page");
  redirect(`${localePath(locale, "/admin/content")}?saved=1`);
}

/* -------------------------------------------------------------------------- */
/* Certificates                                                               */
/* -------------------------------------------------------------------------- */

export async function revokeCertificateAction(formData: FormData) {
  const admin = await requireAdminAction("certificates:write");
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
  const admin = await requireAdminAction("certificates:write");
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
