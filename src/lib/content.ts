import sanitizeHtml from "sanitize-html";

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/** Accept a YouTube URL or bare ID and return only the validated video ID. */
export function normalizeYouTubeVideoId(value: string): string | null {
  const input = value.trim();
  if (YOUTUBE_ID.test(input)) return input;

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  let candidate: string | null = null;
  if (host === "youtu.be") {
    candidate = url.pathname.split("/").filter(Boolean)[0] ?? null;
  } else if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "youtube-nocookie.com"
  ) {
    if (url.pathname === "/watch") candidate = url.searchParams.get("v");
    else {
      const parts = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(parts[0] ?? "")) {
        candidate = parts[1] ?? null;
      }
    }
  }
  return candidate && YOUTUBE_ID.test(candidate) ? candidate : null;
}

const RICH_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "h2", "h3", "h4", "ul", "ol", "li", "blockquote",
    "strong", "b", "em", "i", "u", "br", "hr", "a", "img",
  ],
  allowedAttributes: {
    a: ["href", "title"],
    img: ["src", "alt", "title", "width", "height"],
  },
  allowedSchemes: ["https", "http", "mailto"],
  allowedSchemesByTag: { img: ["https"] },
  allowProtocolRelative: false,
  disallowedTagsMode: "discard",
  nestingLimit: 6,
  nonTextTags: ["script", "style", "textarea", "option", "noscript"],
};

/** Rich text is cleaned on the server before it is stored or rendered. */
export function sanitizeRichText(value: string): string {
  return sanitizeHtml(value, RICH_TEXT_OPTIONS);
}

export type PublicQuestion = {
  id: string;
  type: string;
  prompt: string;
  options: Array<{ id: string; label: string }>;
  minWords: number;
  points: number;
};

/** Use a snapshot override when set; otherwise keep the versioned inherited rule. */
export function resolveVersionPassMark(
  snapshotPassMark: number | null | undefined,
  effectivePassMark: number,
): number {
  return snapshotPassMark ?? effectivePassMark;
}

/** Project a server-side question into a participant-safe shape. */
export function toPublicQuestion(
  step: {
    id: string;
    type: string;
    promptBn: string;
    promptEn: string;
    options: unknown;
    minWords: number;
    points: number;
  },
  locale: "bn" | "en",
): PublicQuestion {
  const options = Array.isArray(step.options)
    ? step.options.flatMap((item) => {
        if (
          item && typeof item === "object" &&
          "id" in item && "bn" in item && "en" in item &&
          typeof item.id === "string" && typeof item.bn === "string" &&
          typeof item.en === "string"
        ) return [{ id: item.id, label: locale === "bn" ? item.bn : item.en }];
        return [];
      })
    : [];

  return {
    id: step.id,
    type: step.type,
    prompt: locale === "bn" ? step.promptBn : step.promptEn,
    options,
    minWords: step.minWords,
    points: step.points,
  };
}

export function hasCompleteTranslations(snapshot: {
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  writtenBn?: string;
  writtenEn?: string;
  steps: Array<{
    promptBn: string;
    promptEn: string;
    options?: Array<{ bn: string; en: string }> | null;
  }>;
}) {
  return Boolean(
    snapshot.titleBn.trim() && snapshot.titleEn.trim() &&
    snapshot.descriptionBn.trim() && snapshot.descriptionEn.trim() &&
    snapshot.steps.every((step) =>
      step.promptBn.trim() && step.promptEn.trim() &&
      (step.options ?? []).every((option) => option.bn.trim() && option.en.trim())
    )
  );
}
