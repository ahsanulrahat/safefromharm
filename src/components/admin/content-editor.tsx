"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";
import { saveModuleAction, type ContentState } from "@/actions/admin";
import { buttonClass, inputClass } from "@/components/ui";
import type { AppLocale } from "@/i18n/routing";

const initialState: ContentState = {};

export type ContentEditorLabels = {
  title: string;
  hint: string;
  jsonLabel: string;
  format: string;
  formatError: string;
  save: string;
  saving: string;
  cancel: string;
  validationTitle: string;
  idNote: string;
  languageGap: string;
  exportJson: string;
  importHint: string;
  invalidVideo: string;
};

type PreviewLabels = {
  videoPreview: string;
  previewAs: string;
  rover: string;
  leader: string;
};

function previewVideoId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = url.pathname.split("/").filter(Boolean)[0] ?? null;
    else if (["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)) {
      if (url.pathname === "/watch") id = url.searchParams.get("v");
      else {
        const parts = url.pathname.split("/").filter(Boolean);
        if (["embed", "shorts", "live"].includes(parts[0] ?? "")) id = parts[1] ?? null;
      }
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function ContentEditor({
  locale,
  originalSlug,
  initialJson,
  hasLanguageGap,
  videoPreviewLabels,
  labels,
}: {
  locale: AppLocale;
  originalSlug: string;
  initialJson: string;
  hasLanguageGap: boolean;
  videoPreviewLabels: PreviewLabels;
  labels: ContentEditorLabels;
}) {
  const [state, action, pending] = useActionState(saveModuleAction, initialState);
  const [value, setValue] = useState(initialJson);
  const [formatError, setFormatError] = useState<string | null>(null);
  const [previewAudience, setPreviewAudience] = useState<"ROVER" | "LEADER">(() => {
    try {
      return JSON.parse(initialJson).audience === "LEADER" ? "LEADER" : "ROVER";
    } catch {
      return "ROVER";
    }
  });
  const parsed = useMemo(() => {
    try { return JSON.parse(value) as Record<string, unknown>; }
    catch { return null; }
  }, [value]);
  const videoId = useMemo(() => previewVideoId(parsed?.videoId), [parsed]);
  const previewTitle = locale === "bn" ? parsed?.titleBn : parsed?.titleEn;
  const previewDescription = locale === "bn" ? parsed?.descriptionBn : parsed?.descriptionEn;
  const previewSteps = Array.isArray(parsed?.steps) ? parsed.steps : [];

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (value !== initialJson) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [initialJson, value]);

  function formatJson() {
    try {
      setValue(JSON.stringify(JSON.parse(value), null, 2));
      setFormatError(null);
    } catch {
      setFormatError(labels.formatError);
    }
  }

  function exportJson() {
    const file = new Blob([value], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${typeof parsed?.slug === "string" ? parsed.slug : "module"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <form action={action} className="mt-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="originalSlug" value={originalSlug} />

      {state.error && (
        <div role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
          {state.error}
        </div>
      )}
      {state.fieldErrors && state.fieldErrors.length > 0 && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <p className="font-semibold">{labels.validationTitle}</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs">
            {state.fieldErrors.map((issue) => <li key={issue}>{issue}</li>)}
          </ul>
        </div>
      )}
      {hasLanguageGap && (
        <p role="status" className="mb-3 rounded-lg border border-gold-300 bg-gold-50 px-3 py-2 text-sm font-semibold text-gold-900">
          {labels.languageGap}
        </p>
      )}

      <label className="text-sm font-semibold text-brand-900" htmlFor="module-json">{labels.jsonLabel}</label>
      <textarea
        id="module-json"
        name="json"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        spellCheck={false}
        rows={30}
        className={inputClass + " mt-1 min-h-[28rem] resize-y font-mono text-xs leading-relaxed"}
      />
      {formatError && <p className="mt-1 text-sm font-medium text-red-700">{formatError}</p>}
      <p className="mt-1 text-xs text-muted">{labels.idNote}</p>
      <p className="mt-1 text-xs text-muted">{labels.importHint}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className={buttonClass("primary")}>
          {pending ? labels.saving : labels.save}
        </button>
        <button type="button" onClick={formatJson} className={buttonClass("secondary")}>{labels.format}</button>
        <button type="button" onClick={exportJson} className={buttonClass("secondary")}>{labels.exportJson}</button>
        <Link href="/admin/content" className={buttonClass("ghost")}>{labels.cancel}</Link>
      </div>

      <section className="mt-6 rounded-xl border border-brand-100 bg-surface-cream/40 p-4 dark:border-brand-900 dark:bg-brand-950/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-brand-950 dark:text-brand-50">{videoPreviewLabels.videoPreview}</h3>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-muted">{videoPreviewLabels.previewAs}</span>
            <button type="button" onClick={() => setPreviewAudience("ROVER")} aria-pressed={previewAudience === "ROVER"} className="rounded-md border border-brand-200 px-2 py-1 font-semibold aria-pressed:bg-brand-100 dark:border-brand-800 dark:aria-pressed:bg-brand-900">{videoPreviewLabels.rover}</button>
            <button type="button" onClick={() => setPreviewAudience("LEADER")} aria-pressed={previewAudience === "LEADER"} className="rounded-md border border-brand-200 px-2 py-1 font-semibold aria-pressed:bg-brand-100 dark:border-brand-800 dark:aria-pressed:bg-brand-900">{videoPreviewLabels.leader}</button>
          </div>
        </div>
        {parsed && typeof parsed.audience === "string" && parsed.audience !== previewAudience && (
          <p className="mt-2 rounded-lg border border-gold-200 bg-gold-50 px-3 py-2 text-xs font-semibold text-gold-900 dark:border-gold-800 dark:bg-gold-950/50 dark:text-gold-200">
            {previewAudience === "ROVER" ? videoPreviewLabels.rover : videoPreviewLabels.leader}: {videoPreviewLabels.previewAs} {videoPreviewLabels.videoPreview} · {parsed.audience}
          </p>
        )}
        {parsed && parsed.audience === previewAudience && (
          <div className="mt-3 rounded-lg border border-brand-100 bg-white p-4 dark:border-brand-900 dark:bg-brand-950/60">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">{previewAudience === "ROVER" ? videoPreviewLabels.rover : videoPreviewLabels.leader} · {locale.toUpperCase()}</p>
            <h4 className="mt-1 text-lg font-bold text-brand-950 dark:text-brand-50">{typeof previewTitle === "string" ? previewTitle : ""}</h4>
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{typeof previewDescription === "string" ? previewDescription : ""}</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-brand-900 dark:text-brand-100">
              {previewSteps.map((rawStep, index) => {
                if (!rawStep || typeof rawStep !== "object") return null;
                const step = rawStep as Record<string, unknown>;
                const prompt = locale === "bn" ? step.promptBn : step.promptEn;
                return (
                  <li key={typeof step.id === "string" ? step.id : `preview-${index}`}>
                    <span>{typeof prompt === "string" ? prompt : ""}</span>
                    {Array.isArray(step.options) && <ul className="mt-1 list-disc pl-5 text-xs text-muted">
                      {step.options.map((rawOption, optionIndex) => {
                        if (!rawOption || typeof rawOption !== "object") return null;
                        const option = rawOption as Record<string, unknown>;
                        const label = locale === "bn" ? option.bn : option.en;
                        return <li key={typeof option.id === "string" ? option.id : `option-${index}-${optionIndex}`}>{typeof label === "string" ? label : ""}</li>;
                      })}
                    </ul>}
                  </li>
                );
              })}
            </ol>
          </div>
        )}
        {videoId ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_180px]">
            <iframe className="aspect-video w-full rounded-lg border-0" src={`https://www.youtube-nocookie.com/embed/${videoId}`} title={videoPreviewLabels.videoPreview} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
            <div>
              {/* Remote YouTube thumbnails stay outside Next's local image optimizer. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="aspect-video w-full rounded-lg object-cover" src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="" />
              <p className="mt-2 text-xs font-semibold text-muted">{locale === "bn" && typeof parsed?.titleBn === "string" ? parsed.titleBn : typeof parsed?.titleEn === "string" ? parsed.titleEn : ""}</p>
            </div>
          </div>
        ) : <p className="mt-3 text-sm text-muted">{labels.invalidVideo}</p>}
      </section>
    </form>
  );
}
