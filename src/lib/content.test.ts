import { describe, expect, it } from "vitest";
import {
  hasCompleteTranslations,
  normalizeYouTubeVideoId,
  resolveVersionPassMark,
  sanitizeRichText,
  toPublicQuestion,
} from "@/lib/content";

describe("content authoring safety", () => {
  it("uses a versioned inherited pass mark and preserves explicit overrides", () => {
    expect(resolveVersionPassMark(null, 80)).toBe(80);
    expect(resolveVersionPassMark(undefined, 75)).toBe(75);
    expect(resolveVersionPassMark(60, 80)).toBe(60);
  });

  it("normalizes supported YouTube URLs and IDs", () => {
    expect(normalizeYouTubeVideoId("aqz-KE-bpKQ")).toBe("aqz-KE-bpKQ");
    expect(normalizeYouTubeVideoId("https://youtu.be/aqz-KE-bpKQ?t=2")).toBe("aqz-KE-bpKQ");
    expect(normalizeYouTubeVideoId("https://www.youtube.com/watch?v=aqz-KE-bpKQ")).toBe("aqz-KE-bpKQ");
    expect(normalizeYouTubeVideoId("https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ")).toBe("aqz-KE-bpKQ");
  });

  it("rejects non-YouTube hosts, unsafe schemes, and malformed IDs", () => {
    expect(normalizeYouTubeVideoId("https://example.com/watch?v=aqz-KE-bpKQ")).toBeNull();
    expect(normalizeYouTubeVideoId("javascript:alert(1)")).toBeNull();
    expect(normalizeYouTubeVideoId("https://youtu.be/not-a-video-id")).toBeNull();
  });

  it("sanitizes rich text server-side while retaining ordinary formatting", () => {
    const clean = sanitizeRichText('<h2>Help</h2><script>alert(1)</script><p><img src="https://cdn.example/a.png" onerror="alert(2)"><a href="javascript:alert(3)">bad link</a></p>');
    expect(clean).toContain("<h2>Help</h2>");
    expect(clean).not.toContain("<script");
    expect(clean).not.toContain("onerror");
    expect(clean).not.toContain("javascript:");
  });

  it("projects questions without answer keys or explanations", () => {
    const publicQuestion = toPublicQuestion({
      id: "q1",
      type: "MULTI_SELECT",
      promptBn: "প্রশ্ন",
      promptEn: "Question",
      options: [{ id: "a", bn: "ক", en: "A" }],
      correctOptionId: "a",
      correctOptionIds: ["a"],
      explanationEn: "Secret explanation",
      minWords: 1,
      points: 2,
    } as never, "en");
    const serialized = JSON.stringify(publicQuestion);
    expect(publicQuestion.options).toEqual([{ id: "a", label: "A" }]);
    expect(serialized).not.toContain("correctOption");
    expect(serialized).not.toContain("Secret explanation");
  });

  it("flags missing translations before publish", () => {
    expect(hasCompleteTranslations({
      titleBn: "বাংলা",
      titleEn: "English",
      descriptionBn: "বিবরণ",
      descriptionEn: "Description",
      steps: [{ promptBn: "প্রশ্ন", promptEn: "", options: [] }],
    })).toBe(false);
  });
});
