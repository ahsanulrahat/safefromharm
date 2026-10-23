import { describe, expect, it } from "vitest";
import {
  evaluateCourse,
  evaluateModule,
  isStepComplete,
  requiredCorrect,
  type ModuleForCompletion,
  type ScoreProgress,
} from "@/lib/completion";

const baseModule: ModuleForCompletion = {
  id: "m1",
  passMark: null,
  steps: [
    { id: "q1", type: "MCQ", minWords: 30 },
    { id: "q2", type: "MCQ", minWords: 30 },
    { id: "q3", type: "MCQ", minWords: 30 },
    { id: "r1", type: "REFLECTION", minWords: 30 },
  ],
};

const perfect: ScoreProgress[] = [
  { stepId: "q1", isCorrect: true, wordCount: null },
  { stepId: "q2", isCorrect: true, wordCount: null },
  { stepId: "q3", isCorrect: true, wordCount: null },
  { stepId: "r1", isCorrect: null, wordCount: 42 },
];

describe("requiredCorrect", () => {
  it("rounds up so a 70% pass mark on 3 questions requires 3", () => {
    expect(requiredCorrect(3, 70)).toBe(3);
    expect(requiredCorrect(10, 70)).toBe(7);
    expect(requiredCorrect(0, 70)).toBe(0);
  });
});

describe("evaluateModule", () => {
  it("requires the video, the MCQ pass mark and every reflection", () => {
    const result = evaluateModule({
      module: baseModule,
      progress: perfect,
      videoWatched: false,
      defaultPassMark: 70,
    });
    expect(result.complete).toBe(false);
    expect(result.mcqPassed).toBe(true);
    expect(result.reflectionsPassed).toBe(true);
  });

  it("passes only when every requirement is met", () => {
    const result = evaluateModule({
      module: baseModule,
      progress: perfect,
      videoWatched: true,
      defaultPassMark: 70,
    });
    expect(result.complete).toBe(true);
    expect(result.mcqRequired).toBe(3);
    expect(result.reflectionsDone).toBe(1);
  });

  it("fails when an MCQ threshold is not reached", () => {
    const progress = perfect.map((p) =>
      p.stepId === "q3" ? { ...p, isCorrect: false } : p
    );
    const result = evaluateModule({
      module: baseModule,
      progress,
      videoWatched: true,
      defaultPassMark: 70,
    });
    expect(result.mcqCorrect).toBe(2);
    expect(result.mcqPassed).toBe(false);
    expect(result.complete).toBe(false);
  });

  it("fails when a reflection is shorter than its minimum", () => {
    const progress = perfect.map((p) =>
      p.stepId === "r1" ? { ...p, wordCount: 12 } : p
    );
    const result = evaluateModule({
      module: baseModule,
      progress,
      videoWatched: true,
      defaultPassMark: 70,
    });
    expect(result.reflectionsDone).toBe(0);
    expect(result.complete).toBe(false);
  });

  it("honours a per-module pass mark override", () => {
    const progress = perfect.map((p) =>
      p.stepId === "q3" ? { ...p, isCorrect: false } : p
    );
    const strict = evaluateModule({
      module: { ...baseModule, passMark: 100 },
      progress,
      videoWatched: true,
      defaultPassMark: 70,
    });
    const lenient = evaluateModule({
      module: { ...baseModule, passMark: 60 },
      progress,
      videoWatched: true,
      defaultPassMark: 70,
    });
    expect(strict.complete).toBe(false);
    expect(lenient.complete).toBe(true);
  });

  it("marks a module with no questions complete once the video is watched", () => {
    const result = evaluateModule({
      module: { id: "empty", passMark: null, steps: [] },
      progress: [],
      videoWatched: true,
      defaultPassMark: 70,
    });
    expect(result.complete).toBe(true);
  });
});

describe("evaluateCourse", () => {
  it("requires at least one module and every module to be complete", () => {
    const empty = evaluateCourse({
      modules: [],
      progress: [],
      watchedModuleIds: [],
      defaultPassMark: 70,
    });
    expect(empty.complete).toBe(false);

    const complete = evaluateCourse({
      modules: [baseModule, { id: "m2", passMark: null, steps: [] }],
      progress: perfect,
      watchedModuleIds: ["m1", "m2"],
      defaultPassMark: 70,
    });
    expect(complete.complete).toBe(true);
    expect(complete.modules).toHaveLength(2);

    const incomplete = evaluateCourse({
      modules: [baseModule],
      progress: perfect,
      watchedModuleIds: [],
      defaultPassMark: 70,
    });
    expect(incomplete.complete).toBe(false);
  });
});

describe("isStepComplete", () => {
  it("uses correctness for MCQs and word count for reflections", () => {
    expect(
      isStepComplete(
        { id: "q1", type: "MCQ", minWords: 30 },
        { stepId: "q1", isCorrect: true, wordCount: null }
      )
    ).toBe(true);
    expect(
      isStepComplete(
        { id: "r1", type: "REFLECTION", minWords: 30 },
        { stepId: "r1", isCorrect: null, wordCount: 30 }
      )
    ).toBe(true);
    expect(
      isStepComplete(
        { id: "r1", type: "REFLECTION", minWords: 30 },
        { stepId: "r1", isCorrect: null, wordCount: 29 }
      )
    ).toBe(false);
  });
});
