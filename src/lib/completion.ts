/**
 * Pure, testable completion rules.
 *
 * A module is complete when:
 *  1. the video has been watched (or explicitly marked as watched), and
 *  2. the MCQ pass mark is met (default 70%, configurable per module), and
 *  3. every reflection answer meets its minimum word count.
 */

export type CompletionStepType =
  | "MCQ"
  | "MULTI_SELECT"
  | "SCENARIO"
  | "REFLECTION"
  | "PARAGRAPH";

export type CompletionStep = {
  id: string;
  type: CompletionStepType;
  minWords: number;
  points?: number;
  approvalRequired?: boolean;
};

export type ScoreProgress = {
  stepId: string;
  isCorrect: boolean | null;
  wordCount: number | null;
  reviewApproved?: boolean;
};

export type ModuleForCompletion = {
  id: string;
  passMark: number | null;
  steps: CompletionStep[];
  mustWatch?: boolean;
  paragraphApprovalRequired?: boolean;
};

export type ModuleEvaluation = {
  moduleId: string;
  complete: boolean;
  videoWatched: boolean;
  mcqTotal: number;
  mcqCorrect: number;
  mcqRequired: number;
  mcqPassed: boolean;
  reflectionsTotal: number;
  reflectionsDone: number;
  reflectionsPassed: boolean;
  passMark: number;
};

export function requiredCorrect(mcqTotal: number, passMark: number) {
  if (mcqTotal === 0) return 0;
  return Math.ceil((mcqTotal * passMark) / 100);
}

export function evaluateModule(input: {
  module: ModuleForCompletion;
  progress: ScoreProgress[];
  videoWatched: boolean;
  defaultPassMark: number;
}): ModuleEvaluation {
  const { module, progress, videoWatched, defaultPassMark } = input;
  const passMark = module.passMark ?? defaultPassMark;

  const mcqSteps = module.steps.filter((s) =>
    s.type === "MCQ" || s.type === "SCENARIO" || s.type === "MULTI_SELECT"
  );
  const reflectionSteps = module.steps.filter((s) =>
    s.type === "REFLECTION" || s.type === "PARAGRAPH"
  );
  const byStep = new Map(progress.map((p) => [p.stepId, p]));

  const mcqTotal = mcqSteps.reduce((total, step) => total + (step.points ?? 1), 0);
  const mcqCorrect = mcqSteps.reduce(
    (total, step) => total + (byStep.get(step.id)?.isCorrect === true ? (step.points ?? 1) : 0),
    0,
  );
  const mcqRequired = requiredCorrect(mcqTotal, passMark);
  const mcqPassed = mcqCorrect >= mcqRequired;

  const reflectionsDone = reflectionSteps.filter((s) => {
    const p = byStep.get(s.id);
    return typeof p?.wordCount === "number" && p.wordCount >= s.minWords &&
      (!s.approvalRequired || p.reviewApproved === true);
  }).length;
  const reflectionsPassed = reflectionsDone === reflectionSteps.length;

  return {
    moduleId: module.id,
    complete: (module.mustWatch === false || videoWatched) && mcqPassed && reflectionsPassed,
    videoWatched,
    mcqTotal,
    mcqCorrect,
    mcqRequired,
    mcqPassed,
    reflectionsTotal: reflectionSteps.length,
    reflectionsDone,
    reflectionsPassed,
    passMark,
  };
}

export function evaluateCourse(input: {
  modules: ModuleForCompletion[];
  progress: ScoreProgress[];
  watchedModuleIds: string[];
  defaultPassMark: number;
}) {
  const watched = new Set(input.watchedModuleIds);
  const modules = input.modules.map((module) =>
    evaluateModule({
      module,
      progress: input.progress,
      videoWatched: watched.has(module.id),
      defaultPassMark: input.defaultPassMark,
    })
  );

  return {
    complete: modules.length > 0 && modules.every((m) => m.complete),
    modules,
  };
}

/** A step's own completion, used for per-step UI state. */
export function isStepComplete(
  step: CompletionStep,
  progress: ScoreProgress | undefined
) {
  if (!progress) return false;
  if (step.type === "MCQ" || step.type === "MULTI_SELECT" || step.type === "SCENARIO") {
    return progress.isCorrect === true;
  }
  return (
    typeof progress.wordCount === "number" && progress.wordCount >= step.minWords &&
    (!step.approvalRequired || progress.reviewApproved === true)
  );
}
