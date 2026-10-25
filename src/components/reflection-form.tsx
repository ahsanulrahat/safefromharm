"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { submitReflectionAction, type ProgressState } from "@/actions/progress";
import { countWords } from "@/lib/text";
import { buttonClass, cardClass, errorClass } from "@/components/ui";

const initialState: ProgressState = {};

export function ReflectionForm({
  moduleSlug,
  stepId,
  prompt,
  minWords,
  defaultAnswer,
  labels,
}: {
  moduleSlug: string;
  stepId: string;
  prompt: string;
  minWords: number;
  defaultAnswer: string;
  labels: {
    submit: string;
    submitting: string;
    words: string;
    minWords: string;
    savedNote: string;
    hint: string;
  };
}) {
  const [state, action, pending] = useActionState(
    submitReflectionAction,
    initialState
  );
  const [answer, setAnswer] = useState(defaultAnswer);
  const router = useRouter();
  const words = countWords(answer);
  const enough = words >= minWords;

  useEffect(() => {
    if (state.ok) router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok, state.wordCount]);

  return (
    <form action={action} className={cardClass}>
      <input type="hidden" name="moduleSlug" value={moduleSlug} />
      <input type="hidden" name="stepId" value={stepId} />
      <label
        htmlFor={`reflection-${stepId}`}
        className="block text-base font-bold leading-snug text-brand-950 dark:text-brand-50 sm:text-lg"
      >
        {prompt}
      </label>
      <p className="mt-1.5 text-xs font-medium text-muted dark:text-brand-300">
        {labels.hint.replace("{min}", String(minWords))}
      </p>
      <div className="relative mt-3">
        <textarea
          id={`reflection-${stepId}`}
          name="answer"
          required
          rows={6}
          maxLength={5000}
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          className="w-full rounded-xl border border-brand-200/90 bg-white p-3.5 text-base text-ink shadow-2xs placeholder:text-muted/60 transition-all focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-brand-800 dark:bg-brand-950/70 dark:text-brand-50 dark:placeholder:text-brand-400/60 dark:focus:border-brand-400 dark:focus:ring-brand-400/20"
          aria-describedby={`reflection-count-${stepId}`}
        />
      </div>
      <div
        id={`reflection-count-${stepId}`}
        className="mt-2 flex items-center justify-between text-xs"
        aria-live="polite"
      >
        <span
          className={
            "rounded-md px-2 py-0.5 font-medium transition-colors " +
            (enough
              ? "bg-brand-50 text-brand-800 font-semibold dark:bg-brand-900/60 dark:text-brand-200"
              : "bg-surface-cream text-muted dark:bg-brand-950 dark:text-brand-400")
          }
        >
          {labels.words.replace("{count}", String(words))} ·{" "}
          {labels.minWords.replace("{min}", String(minWords))}
        </span>
        {enough && (
          <span className="inline-flex items-center gap-1 font-semibold text-brand-700 dark:text-brand-300">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-100 text-brand-800 text-[10px] dark:bg-brand-800 dark:text-brand-100">
              ✓
            </span>
            Ready
          </span>
        )}
      </div>

      {state.error && (
        <p className={errorClass} role="alert">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p
          className="mt-3.5 flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50/90 px-3.5 py-2.5 text-sm font-semibold text-brand-900 dark:border-brand-800 dark:bg-brand-900/60 dark:text-brand-200"
          role="status"
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-xs text-xs">
            ✓
          </span>
          {labels.savedNote}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={buttonClass("primary") + " mt-5"}
      >
        {pending ? labels.submitting : labels.submit}
      </button>
    </form>
  );
}
