"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getParticipantId } from "@/lib/participant-session";
import { getCourseState, recalcParticipant } from "@/lib/course";
import { countWords } from "@/lib/text";
import { encryptText } from "@/lib/crypto";

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

  const courseModule = await prisma.module.findFirst({
    where: { slug: moduleSlug, published: true },
    include: { steps: { orderBy: { order: "asc" } } },
  });
  if (!courseModule) throw new Error("Module not found");

  const state = await getCourseState(participantId);
  if (!state.unlocked[courseModule.id]) throw new Error("Module is locked");

  return { participantId, module: courseModule, state };
}

export async function markVideoWatchedAction(
  moduleSlug: string
): Promise<ProgressState> {
  try {
    const { participantId, module } = await participantAndModule(moduleSlug);
    await prisma.moduleProgress.upsert({
      where: {
        participantId_moduleId: { participantId, moduleId: module.id },
      },
      create: {
        participantId,
        moduleId: module.id,
        videoWatchedAt: new Date(),
      },
      update: { videoWatchedAt: new Date() },
    });
    await recalcParticipant(participantId);
    refreshCoursePaths();
    return { ok: true, saved: true };
  } catch (error) {
    console.error("markVideoWatched failed", error);
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
  const optionId = String(formData.get("optionId") ?? "");

  if (!optionId) return { error: "Choose an answer first." };

  try {
    const { participantId, module, state } = await participantAndModule(moduleSlug);
    const step = module.steps.find((s) => s.id === stepId);
    if (!step || step.type !== "MCQ") return { error: "Question not found." };

    const options = parseOptions(step.options);
    if (!options.some((option) => option.id === optionId)) {
      return { error: "That answer is not valid for this question." };
    }

    const isCorrect = step.correctOptionId === optionId;

    await prisma.stepProgress.upsert({
      where: {
        participantId_stepId: { participantId, stepId },
      },
      create: {
        participantId,
        stepId,
        moduleId: module.id,
        answerJson: { optionId },
        isCorrect,
        completedAt: new Date(),
      },
      update: {
        answerJson: { optionId },
        isCorrect,
        completedAt: new Date(),
      },
    });

    await recalcParticipant(participantId);
    refreshCoursePaths();

    const stillLocked = state.unlocked[module.id] === false;
    if (stillLocked) return { error: "Module is locked." };
    return { ok: true, correct: isCorrect };
  } catch (error) {
    console.error("submitMcq failed", error);
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
    const { participantId, module } = await participantAndModule(moduleSlug);
    const step = module.steps.find((s) => s.id === stepId);
    if (!step || step.type !== "REFLECTION") {
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
        completedAt: new Date(),
      },
      update: {
        wordCount: words,
        reflectionCipher: encryptText(answer),
        completedAt: new Date(),
      },
    });

    await recalcParticipant(participantId);
    refreshCoursePaths();
    return { ok: true, saved: true, wordCount: words };
  } catch (error) {
    console.error("submitReflection failed", error);
    return { error: "Could not save your reflection. Please try again." };
  }
}
