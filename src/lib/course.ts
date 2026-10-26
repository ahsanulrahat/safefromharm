import { prisma } from "@/lib/prisma";
import { getPassMark } from "@/lib/settings";
import { contentModuleSchema } from "@/lib/validation";
import {
  evaluateCourse,
  evaluateModule,
  type ModuleEvaluation,
  type ModuleForCompletion,
  type ScoreProgress,
} from "@/lib/completion";
import { issueCertificateIfEligible } from "@/lib/certificates";
import { resolveVersionPassMark } from "@/lib/content";
import { Prisma, type Module, type ModuleContentVersion, type Step } from "@prisma/client";

export type CourseModule = Module & { steps: Step[]; contentVersionId: string | null };

function moduleFromVersion(module: Module & { steps: Step[] }, version?: ModuleContentVersion): CourseModule {
  if (!version) {
    return {
      ...module,
      steps: module.steps.filter((step) => step.archivedAt === null),
      contentVersionId: null,
    };
  }
  const parsed = contentModuleSchema.safeParse(version.snapshot);
  if (!parsed.success) {
    return {
      ...module,
      steps: module.steps.filter((step) => step.archivedAt === null),
      contentVersionId: version.id,
    };
  }
  const snapshot = parsed.data;
  const timestamp = version.publishedAt ?? version.createdAt;
  return {
    ...module,
    slug: snapshot.slug,
    audience: snapshot.audience,
    titleBn: snapshot.titleBn,
    titleEn: snapshot.titleEn,
    descriptionBn: snapshot.descriptionBn,
    descriptionEn: snapshot.descriptionEn,
    writtenBn: snapshot.writtenBn,
    writtenEn: snapshot.writtenEn,
    videoId: snapshot.videoId,
    mustWatch: snapshot.mustWatch,
    attemptsAllowed: snapshot.attemptsAllowed,
    paragraphApprovalRequired: snapshot.paragraphApprovalRequired,
    // Preserve a module's inherited pass mark for this immutable version.
    // The snapshot may intentionally keep passMark=null to inherit the
    // global setting for learners who begin after the next settings publish.
    passMark: resolveVersionPassMark(snapshot.passMark, version.effectivePassMark),
    published: true,
    steps: snapshot.steps.map((step, order) => ({
      id: step.id ?? `${version.id}-step-${order}`,
      moduleId: module.id,
      order,
      type: step.type,
      promptBn: step.promptBn,
      promptEn: step.promptEn,
      options: step.options as Prisma.JsonValue ?? null,
      correctOptionId: step.correctOptionId ?? null,
      correctOptionIds: step.correctOptionIds as Prisma.JsonValue ?? null,
      explanationBn: step.explanationBn,
      explanationEn: step.explanationEn,
      points: step.points,
      archivedAt: null,
      minWords: step.minWords,
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
    contentVersionId: version.id,
  };
}

export type CourseState = {
  modules: CourseModule[];
  evaluations: ModuleEvaluation[];
  unlocked: Record<string, boolean>;
  progressByStep: Map<
    string,
    {
      isCorrect: boolean | null;
      wordCount: number | null;
      completedAt: Date;
      answerOptionId: string | null;
      answerOptionIds: string[];
      reflectionCipher: string | null;
      reviewStatus: string;
      reviewComment: string | null;
    }
  >;
  watchedModuleIds: Set<string>;
  courseComplete: boolean;
  activeCertificate: {
    id: string;
    issuedAt: Date;
    revokedAt: Date | null;
    revokedReason: string | null;
  } | null;
  anyCertificate: boolean;
  defaultPassMark: number;
};

export async function getCourseState(participantId: string): Promise<CourseState> {
  const [participant, databaseModules, defaultPassMark, moduleProgress, stepProgress, certificates] =
    await Promise.all([
      prisma.participant.findUnique({ where: { id: participantId } }),
      prisma.module.findMany({
        where: { published: true },
        orderBy: { order: "asc" },
        include: { steps: { orderBy: { order: "asc" } } },
      }),
      getPassMark(),
      prisma.moduleProgress.findMany({ where: { participantId } }),
      prisma.stepProgress.findMany({ where: { participantId } }),
      prisma.certificate.findMany({
        where: { participantId },
        orderBy: { issuedAt: "desc" },
      }),
    ]);

  const moduleIds = databaseModules.map((module) => module.id);
  const pinnedVersionIds = moduleProgress.flatMap((progress) => progress.contentVersionId ? [progress.contentVersionId] : []);
  const [publishedVersions, pinnedVersions] = await Promise.all([
    prisma.moduleContentVersion.findMany({
      where: { moduleId: { in: moduleIds }, status: "PUBLISHED" },
      orderBy: [{ moduleId: "asc" }, { version: "desc" }],
    }),
    pinnedVersionIds.length
      ? prisma.moduleContentVersion.findMany({ where: { id: { in: pinnedVersionIds } } })
      : Promise.resolve([]),
  ]);
  const latestPublishedByModule = new Map<string, ModuleContentVersion>();
  for (const version of publishedVersions) {
    if (!latestPublishedByModule.has(version.moduleId)) latestPublishedByModule.set(version.moduleId, version);
  }
  const pinnedById = new Map(pinnedVersions.map((version) => [version.id, version]));
  const moduleProgressById = new Map(moduleProgress.map((progress) => [progress.moduleId, progress]));
  const versionByModuleId = new Map<string, string | null>();
  const modules = databaseModules.map((module) => {
    const progress = moduleProgressById.get(module.id);
    const version = (progress?.contentVersionId ? pinnedById.get(progress.contentVersionId) : undefined) ??
      latestPublishedByModule.get(module.id);
    versionByModuleId.set(module.id, version?.id ?? null);
    return moduleFromVersion(module, version);
  });

  const audienceModules = participant?.audience
    ? modules.filter((m) => m.audience === participant.audience)
    : modules;

  const watchedModuleIds = new Set(
    moduleProgress.filter((p) => p.videoWatchedAt).map((p) => p.moduleId)
  );

  const relevantStepProgress = stepProgress.filter((progress) => {
    const versionId = versionByModuleId.get(progress.moduleId) ?? null;
    return versionId ? progress.contentVersionId === versionId : !progress.contentVersionId;
  });

  const scores: ScoreProgress[] = relevantStepProgress.map((p) => ({
    stepId: p.stepId,
    isCorrect: p.isCorrect,
    wordCount: p.wordCount,
    reviewApproved: p.reviewStatus === "APPROVED",
  }));

  const modulesForCompletion: ModuleForCompletion[] = audienceModules.map((m) => ({
    id: m.id,
    passMark: m.passMark,
    steps: m.steps.map((s) => ({
      id: s.id,
      type: s.type,
      minWords: s.minWords,
      points: s.points,
      approvalRequired: m.paragraphApprovalRequired &&
        (s.type === "REFLECTION" || s.type === "PARAGRAPH"),
    })),
    mustWatch: m.mustWatch,
  }));

  const evaluation = evaluateCourse({
    modules: modulesForCompletion,
    progress: scores,
    watchedModuleIds: [...watchedModuleIds],
    defaultPassMark,
  });

  // Modules unlock in order; module 0 is always open.
  const unlocked: Record<string, boolean> = {};
  const evaluationByModuleId = new Map(evaluation.modules.map((item) => [item.moduleId, item]));
  audienceModules.forEach((m, index) => {
    unlocked[m.id] =
      index === 0 ||
      Boolean(
        evaluationByModuleId.get(audienceModules[index - 1]?.id ?? "")?.complete ||
        moduleProgress.find(
          (p) => p.moduleId === audienceModules[index - 1]?.id && p.completedAt,
        ),
      );
  });

  const progressByStep = new Map(
    relevantStepProgress.map((p) => {
      let answerOptionId: string | null = null;
      let answerOptionIds: string[] = [];
      if (
        p.answerJson &&
        typeof p.answerJson === "object" &&
        !Array.isArray(p.answerJson) &&
        "optionId" in p.answerJson &&
        typeof p.answerJson.optionId === "string"
      ) {
        answerOptionId = p.answerJson.optionId;
      }
      if (
        p.answerJson && typeof p.answerJson === "object" && !Array.isArray(p.answerJson) &&
        "optionIds" in p.answerJson && Array.isArray(p.answerJson.optionIds)
      ) {
        answerOptionIds = p.answerJson.optionIds.filter((id): id is string => typeof id === "string");
      }
      return [
        p.stepId,
        {
          isCorrect: p.isCorrect,
          wordCount: p.wordCount,
          completedAt: p.completedAt,
          answerOptionId,
          answerOptionIds,
          reflectionCipher: p.reflectionCipher,
          reviewStatus: p.reviewStatus,
          reviewComment: p.reviewComment,
        },
      ] as const;
    })
  );

  const active = certificates.find((c) => c.activeKey === participantId) ?? null;

  return {
    modules: audienceModules,
    evaluations: evaluation.modules,
    unlocked,
    progressByStep,
    watchedModuleIds,
    courseComplete: evaluation.complete,
    activeCertificate: active
      ? {
          id: active.id,
          issuedAt: active.issuedAt,
          revokedAt: active.revokedAt,
          revokedReason: active.revokedReason,
        }
      : null,
    anyCertificate: certificates.length > 0,
    defaultPassMark,
  };
}

/**
 * Load only the published module context needed to authorize a progress write.
 * The regular course view needs every participant answer and certificate; a
 * single answer submission does not. Keeping this query scoped avoids doing
 * two full course-state reads for every step.
 */
export async function getParticipantModuleContext(
  participantId: string,
  moduleSlug: string,
) {
  const [participant, databaseModules, moduleProgress, stepProgress, defaultPassMark] = await Promise.all([
    prisma.participant.findUnique({
      where: { id: participantId },
      select: { audience: true },
    }),
    prisma.module.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
      include: { steps: { orderBy: { order: "asc" } } },
    }),
    prisma.moduleProgress.findMany({ where: { participantId } }),
    prisma.stepProgress.findMany({
      where: { participantId },
      select: {
        moduleId: true,
        contentVersionId: true,
        stepId: true,
        isCorrect: true,
        wordCount: true,
        reviewStatus: true,
      },
    }),
    getPassMark(),
  ]);

  if (!participant) throw new Error("Participant not found");

  const moduleIds = databaseModules.map((module) => module.id);
  const pinnedVersionIds = moduleProgress.flatMap((progress) =>
    progress.contentVersionId ? [progress.contentVersionId] : [],
  );
  const versions = await prisma.moduleContentVersion.findMany({
    where: {
      OR: [
        { moduleId: { in: moduleIds }, status: "PUBLISHED" },
        ...(pinnedVersionIds.length ? [{ id: { in: pinnedVersionIds } }] : []),
      ],
    },
    orderBy: [{ moduleId: "asc" }, { version: "desc" }],
  });

  const latestPublishedByModule = new Map<string, ModuleContentVersion>();
  const versionById = new Map(versions.map((version) => [version.id, version]));
  for (const version of versions) {
    if (version.status === "PUBLISHED" && !latestPublishedByModule.has(version.moduleId)) {
      latestPublishedByModule.set(version.moduleId, version);
    }
  }
  const moduleProgressById = new Map(moduleProgress.map((progress) => [progress.moduleId, progress]));
  const modules = databaseModules.map((module) => {
    const progress = moduleProgressById.get(module.id);
    const version = (progress?.contentVersionId
      ? versionById.get(progress.contentVersionId)
      : undefined) ?? latestPublishedByModule.get(module.id);
    return moduleFromVersion(module, version);
  });
  const audienceModules = participant.audience
    ? modules.filter((module) => module.audience === participant.audience)
    : modules;
  const index = audienceModules.findIndex((module) => module.slug === moduleSlug);
  if (index < 0) throw new Error("Module not found");

  const courseModule = audienceModules[index];
  if (index > 0) {
    const previous = audienceModules[index - 1];
    const previousVersionId = previous.contentVersionId;
    const previousProgress = stepProgress
      .filter((progress) =>
        progress.moduleId === previous.id && progress.contentVersionId === previousVersionId
      )
      .map((progress): ScoreProgress => ({
        stepId: progress.stepId,
        isCorrect: progress.isCorrect,
        wordCount: progress.wordCount,
        reviewApproved: progress.reviewStatus === "APPROVED",
      }));
    const previousComplete = isParticipantModuleComplete(
      previous,
      Boolean(moduleProgressById.get(previous.id)?.videoWatchedAt),
      defaultPassMark,
      previousProgress,
    );
    if (!moduleProgressById.get(previous.id)?.completedAt && !previousComplete) {
      throw new Error("Module is locked");
    }
  }

  return {
    module: courseModule,
    watched: Boolean(moduleProgressById.get(courseModule.id)?.videoWatchedAt),
    isLastModule: index === audienceModules.length - 1,
    defaultPassMark,
    progress: stepProgress
      .filter((progress) =>
        progress.moduleId === courseModule.id &&
        progress.contentVersionId === courseModule.contentVersionId
      )
      .map((progress): ScoreProgress => ({
        stepId: progress.stepId,
        isCorrect: progress.isCorrect,
        wordCount: progress.wordCount,
        reviewApproved: progress.reviewStatus === "APPROVED",
      })),
  };
}

/** Evaluate the module from the already-loaded participant progress snapshot. */
export function isParticipantModuleComplete(
  module: CourseModule,
  videoWatched: boolean,
  defaultPassMark: number,
  savedProgress: ScoreProgress[],
  changedProgress?: ScoreProgress,
) {
  const moduleForCompletion: ModuleForCompletion = {
    id: module.id,
    passMark: module.passMark,
    mustWatch: module.mustWatch,
    steps: module.steps.map((step) => ({
      id: step.id,
      type: step.type as ModuleForCompletion["steps"][number]["type"],
      minWords: step.minWords,
      points: step.points,
      approvalRequired: module.paragraphApprovalRequired &&
        (step.type === "REFLECTION" || step.type === "PARAGRAPH"),
    })),
  };
  const progressByStep = new Map(savedProgress.map((step) => [step.stepId, step]));
  if (changedProgress) progressByStep.set(changedProgress.stepId, changedProgress);

  return evaluateModule({
    module: moduleForCompletion,
    progress: [...progressByStep.values()],
    videoWatched,
    defaultPassMark,
  }).complete;
}

/** Persist the completed module directly. The authorized module context has
 * already proven all earlier audience modules complete; only the final module
 * can make the whole course eligible for a certificate. */
export async function persistParticipantModuleCompletion(
  participantId: string,
  module: CourseModule,
  isLastModule: boolean,
) {
  const completedAt = new Date();
  await prisma.moduleProgress.upsert({
    where: {
      participantId_moduleId: { participantId, moduleId: module.id },
    },
    create: {
      participantId,
      moduleId: module.id,
      contentVersionId: module.contentVersionId,
      videoWatchedAt: completedAt,
      completedAt,
    },
    update: {
      contentVersionId: module.contentVersionId,
      videoWatchedAt: completedAt,
      completedAt,
    },
  });

  if (isLastModule) await issueCertificateIfEligible(participantId);
}

/**
 * Persist module completion and issue a certificate when the whole course is
 * complete. Safe to call after every step; it never un-completes a module.
 */
export async function recalcParticipant(participantId: string) {
  const state = await getCourseState(participantId);
  const now = new Date();

  for (const evaluation of state.evaluations) {
    if (!evaluation.complete) continue;
    const completedModule = state.modules.find((m) => m.id === evaluation.moduleId);
    if (!completedModule) continue;
    await prisma.moduleProgress.upsert({
      where: {
        participantId_moduleId: {
          participantId,
          moduleId: evaluation.moduleId,
        },
      },
      create: {
        participantId,
        moduleId: evaluation.moduleId,
        contentVersionId: completedModule.contentVersionId,
        videoWatchedAt: now,
        completedAt: now,
      },
      update: {
        completedAt: now,
        videoWatchedAt: now,
      },
    });
  }

  if (state.courseComplete && !state.anyCertificate) {
    await issueCertificateIfEligible(participantId);
    return getCourseState(participantId);
  }

  return state;
}
