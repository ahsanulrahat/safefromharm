"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { localePath } from "@/i18n/locale-path";
import { requireAdminAction } from "@/lib/admin";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { recalcParticipant } from "@/lib/course";

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function reviewWrittenSubmissionAction(formData: FormData) {
  const admin = await requireAdminAction("responses:review");
  const id = field(formData, "submissionId");
  const decision = field(formData, "decision");
  const comment = field(formData, "comment").slice(0, 2_000);
  const locale = field(formData, "locale") === "bn" ? "bn" : "en";
  const moduleSlug = field(formData, "moduleSlug").slice(0, 80);
  const participantId = field(formData, "participantId").slice(0, 40);

  if (!id || (decision !== "approve" && decision !== "request_revision")) {
    redirect(`${localePath(locale, "/admin/responses")}?error=invalid`);
  }
  if (decision === "request_revision" && !comment) {
    redirect(`${localePath(locale, "/admin/responses")}?error=comment`);
  }

  const row = await prisma.stepProgress.findUnique({
    where: { id },
    include: { step: { select: { type: true } } },
  });
  if (!row || !row.reflectionCipher || (row.step.type !== "REFLECTION" && row.step.type !== "PARAGRAPH")) {
    redirect(`${localePath(locale, "/admin/responses")}?error=missing`);
  }

  const reviewStatus = decision === "approve" ? "APPROVED" : "REVISION_REQUESTED";
  await prisma.$transaction(async (tx) => {
    await tx.stepProgress.update({
      where: { id },
      data: { reviewStatus, reviewComment: comment || null, reviewedById: admin.id, reviewedAt: new Date() },
    });
    await audit({
      tx,
      required: true,
      actorId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: decision === "approve" ? "WRITTEN_SUBMISSION_APPROVE" : "WRITTEN_SUBMISSION_REVISION",
      targetType: "StepProgress",
      targetId: id,
      before: { reviewStatus: row.reviewStatus },
      after: { reviewStatus, commentChanged: Boolean(comment) },
    });
  });

  if (decision === "approve") await recalcParticipant(row.participantId);
  revalidatePath("/[locale]/admin/responses", "page");
  revalidatePath("/[locale]/course", "page");
  revalidatePath("/[locale]/course/[moduleSlug]", "page");
  const query = new URLSearchParams();
  if (moduleSlug) query.set("module", moduleSlug);
  if (participantId) query.set("participant", participantId);
  redirect(`${localePath(locale, "/admin/responses")}${query.size ? `?${query}` : ""}`);
}
