"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getParticipantId } from "@/lib/participant-session";
import {
  getParticipantModuleContext,
  isParticipantModuleComplete,
  persistParticipantModuleCompletion,
} from "@/lib/course";
import type { ScoreProgress } from "@/lib/completion";
import { countWords } from "@/lib/text";
import { encryptText } from "@/lib/crypto";
import { safeErrorDetails } from "@/lib/safe-log";

export type ProgressState = {
  ok?: boolean;
  error?: string;
  correct?: boolean;
  wordCount?: number;
  saved?: boolean;
};

type Option = { id: string; bn: string; en: string };

function parseOptions(value: unknown): Option[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (
      item &&
      typeof item === "object" &&
      "id" in item &&
      "bn" in item &&
      "en" in item &&
      typeof item.id === "string" &&
      typeof item.bn === "string" &&
      typeof item.en === "string"
    ) {
      return [{ id: item.id, bn: item.bn, en: item.en }];
    }
    return [];
  });
}

function refreshCoursePaths() {
  revalidatePath("/[locale]/course", "page");
  revalidatePath("/[locale]/course/[moduleSlug]", "page");
  revalidatePath("/[locale]/certificate", "page");
  revalidatePath("/[locale]/registered", "page");
}

async function participantAndModule(moduleSlug: string) {
  const participantId = await getParticipantId();
  if (!participantId) throw new Error("Not signed in as a participant");

  const context = await getParticipantModuleContext(participantId, moduleSlug);

  return { participantId, ...context };
}

async function completeModuleIfEligible(
  participantId: string,
  module: Awaited<ReturnType<typeof getParticipantModuleContext>>["module"],
  videoWatched: boolean,
  isLastModule: boolean,
  defaultPassMark: number,
  progress: ScoreProgress[],
  changedProgress?: ScoreProgress,
) {
  if (isParticipantModuleComplete(module, videoWatched, defaultPassMark, progress, changedProgress)) {
    await persistParticipantModuleCompletion(participantId, module, isLastModule);
  }
}

async function pinModuleVersion(
  participantId: string,
  moduleId: string,
  contentVersionId: string | null,
) {
  await prisma.moduleProgress.upsert({
    where: { participantId_moduleId: { participantId, moduleId } },
    create: { participantId, moduleId, contentVersionId },
    update: { contentVersionId },
  });
}

export async function markVideoWatchedAction(
  moduleSlug: string
): Promise<ProgressState> {
  try {
    const { participantId, module, isLastModule, defaultPassMark, progress } = await participantAndModule(moduleSlug);
    await prisma.moduleProgress.upsert({
      where: {
        participantId_moduleId: { participantId, moduleId: module.id },
      },
      create: {
        participantId,
        moduleId: module.id,
        contentVersionId: module.contentVersionId,
        videoWatchedAt: new Date(),
      },
      update: { videoWatchedAt: new Date(), contentVersionId: module.contentVersionId },
    });
    await completeModuleIfEligible(participantId, module, true, isLastModule, defaultPassMark, progress);
    refreshCoursePaths();
    return { ok: true, saved: true };
  } catch (error) {
    console.error("markVideoWatched failed", safeErrorDetails(error));
    return { error: "Could not save video progress." };
  }
}

export async function markVideoWatchedFormAction(formData: FormData) {
  const moduleSlug = String(formData.get("moduleSlug") ?? "");
  const result = await markVideoWatchedAction(moduleSlug);
  if (!result.ok) {
    // Server actions called from forms cannot return state; the page is
    // refreshed either way and shows the stored watch state.
    console.error(result.error);
  }
}

export async function submitMcqAction(
  _prev: ProgressState,
  formData: FormData
): Promise<ProgressState> {
  const moduleSlug = String(formData.get("moduleSlug") ?? "");
  const stepId = String(formData.get("stepId") ?? "");
  const singleOptionId = String(formData.get("optionId") ?? "");
  const multiOptionIds = formData.getAll("optionIds").filter((value): value is string => typeof value === "string");

  try {
    const { participantId, module, watched, isLastModule, defaultPassMark, progress } = await participantAndModule(moduleSlug);
    const step = module.steps.find((s) => s.id === stepId);
    if (!step || !["MCQ", "SCENARIO", "MULTI_SELECT"].includes(step.type)) return { error: "Question not found." };

    const isMultiple = step.type === "MULTI_SELECT";
    const selectedIds = isMultiple ? [...new Set(multiOptionIds)] : singleOptionId ? [singleOptionId] : [];
    if (selectedIds.length === 0) return { error: "Choose an answer first." };

    const options = parseOptions(step.options);
    if (selectedIds.some((id) => !options.some((option) => option.id === id))) {
      return { error: "That answer is not valid for this question." };
    }

    let correctOptionIds: string[] = [];
    if (step.type === "MULTI_SELECT" && Array.isArray(step.correctOptionIds)) {
      correctOptionIds = step.correctOptionIds.filter((id): id is string => typeof id === "string");
    } else if (step.correctOptionId) {
      correctOptionIds = [step.correctOptionId];
    }
    const isCorrect = selectedIds.length === correctOptionIds.length &&
      selectedIds.every((id) => correctOptionIds.includes(id));
    const answerJson = isMultiple ? { optionIds: selectedIds } : { optionId: selectedIds[0] };
    await pinModuleVersion(participantId, module.id, module.contentVersionId);

    await prisma.stepProgress.upsert({
      where: {
        participantId_stepId: { participantId, stepId },
      },
      create: {
        participantId,
        stepId,
        moduleId: module.id,
        answerJson,
        isCorrect,
        contentVersionId: module.contentVersionId,
        completedAt: new Date(),
      },
      update: {
        answerJson,
        isCorrect,
        contentVersionId: module.contentVersionId,
        completedAt: new Date(),
      },
    });

    if (isCorrect) {
      await completeModuleIfEligible(participantId, module, watched, isLastModule, defaultPassMark, progress, {
        stepId,
        isCorrect,
        wordCount: null,
        reviewApproved: false,
      });
    }
    refreshCoursePaths();

    return { ok: true, correct: isCorrect };
  } catch (error) {
    console.error("submitMcq failed", safeErrorDetails(error));
    return { error: "Could not save your answer. Please try again." };
  }
}

export async function submitReflectionAction(
  _prev: ProgressState,
  formData: FormData
): Promise<ProgressState> {
  const moduleSlug = String(formData.get("moduleSlug") ?? "");
  const stepId = String(formData.get("stepId") ?? "");
  const answer = String(formData.get("answer") ?? "").trim();

  try {
    const { participantId, module, watched, isLastModule, defaultPassMark, progress } = await participantAndModule(moduleSlug);
    const step = module.steps.find((s) => s.id === stepId);
    if (!step || (step.type !== "REFLECTION" && step.type !== "PARAGRAPH")) {
      return { error: "Reflection not found." };
    }

    if (answer.length > 5000) {
      return { error: "Please keep your reflection under 5000 characters." };
    }

    const words = countWords(answer);
    if (words < step.minWords) {
      return {
        error: `Please write at least ${step.minWords} words (you wrote ${words}).`,
        wordCount: words,
      };
    }

    await pinModuleVersion(participantId, module.id, module.contentVersionId);

    await prisma.stepProgress.upsert({
      where: {
        participantId_stepId: { participantId, stepId },
      },
      create: {
        participantId,
        stepId,
        moduleId: module.id,
        wordCount: words,
        reflectionCipher: encryptText(answer),
        contentVersionId: module.contentVersionId,
        reviewStatus: module.paragraphApprovalRequired ? "PENDING" : "NOT_REQUIRED",
        reviewComment: null,
        reviewedById: null,
        reviewedAt: null,
        completedAt: new Date(),
      },
      update: {
        wordCount: words,
        reflectionCipher: encryptText(answer),
        contentVersionId: module.contentVersionId,
        reviewStatus: module.paragraphApprovalRequired ? "PENDING" : "NOT_REQUIRED",
        reviewComment: null,
        reviewedById: null,
        reviewedAt: null,
        completedAt: new Date(),
      },
    });

    await completeModuleIfEligible(participantId, module, watched, isLastModule, defaultPassMark, progress, {
      stepId,
      isCorrect: null,
      wordCount: words,
      reviewApproved: false,
    });
    refreshCoursePaths();
    return { ok: true, saved: true, wordCount: words };
  } catch (error) {
    console.error("submitReflection failed", safeErrorDetails(error));
    return { error: "Could not save your reflection. Please try again." };
  }
}
