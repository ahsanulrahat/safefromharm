import { prisma } from "@/lib/prisma";
import { getPassMark } from "@/lib/settings";
import {
  evaluateCourse,
  type ModuleEvaluation,
  type ModuleForCompletion,
  type ScoreProgress,
} from "@/lib/completion";
import { issueCertificateIfEligible } from "@/lib/certificates";
import type { Module, Step } from "@prisma/client";

export type CourseModule = Module & { steps: Step[] };

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
      reflectionCipher: string | null;
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
  const [modules, defaultPassMark, moduleProgress, stepProgress, certificates] =
    await Promise.all([
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

  const watchedModuleIds = new Set(
    moduleProgress.filter((p) => p.videoWatchedAt).map((p) => p.moduleId)
  );

  const scores: ScoreProgress[] = stepProgress.map((p) => ({
    stepId: p.stepId,
    isCorrect: p.isCorrect,
    wordCount: p.wordCount,
  }));

  const modulesForCompletion: ModuleForCompletion[] = modules.map((m) => ({
    id: m.id,
    passMark: m.passMark,
    steps: m.steps.map((s) => ({
      id: s.id,
      type: s.type,
      minWords: s.minWords,
    })),
  }));

  const evaluation = evaluateCourse({
    modules: modulesForCompletion,
    progress: scores,
    watchedModuleIds: [...watchedModuleIds],
    defaultPassMark,
  });

  // Modules unlock in order; module 0 is always open.
  const unlocked: Record<string, boolean> = {};
  modules.forEach((m, index) => {
    unlocked[m.id] = index === 0 || Boolean(moduleProgress.find(
      (p) => p.moduleId === modules[index - 1]?.id && p.completedAt
    ));
  });

  const progressByStep = new Map(
    stepProgress.map((p) => {
      let answerOptionId: string | null = null;
      if (
        p.answerJson &&
        typeof p.answerJson === "object" &&
        !Array.isArray(p.answerJson) &&
        "optionId" in p.answerJson &&
        typeof p.answerJson.optionId === "string"
      ) {
        answerOptionId = p.answerJson.optionId;
      }
      return [
        p.stepId,
        {
          isCorrect: p.isCorrect,
          wordCount: p.wordCount,
          completedAt: p.completedAt,
          answerOptionId,
          reflectionCipher: p.reflectionCipher,
        },
      ] as const;
    })
  );

  const active = certificates.find((c) => c.activeKey === participantId) ?? null;

  return {
    modules,
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
  }

  return getCourseState(participantId);
}
