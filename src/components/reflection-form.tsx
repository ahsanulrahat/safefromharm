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
        className="text-base font-semibold leading-snug text-brand-950"
      >
        {prompt}
      </label>
      <p className="mt-1 text-xs text-muted">
        {labels.hint.replace("{min}", String(minWords))}
      </p>
      <textarea
        id={`reflection-${stepId}`}
        name="answer"
        required
        rows={6}
        maxLength={5000}
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        className="mt-3 w-full rounded-lg border border-brand-200 bg-white px-3 py-2.5 text-base text-ink shadow-sm placeholder:text-muted/70 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        aria-describedby={`reflection-count-${stepId}`}
      />
      <div
        id={`reflection-count-${stepId}`}
        className="mt-1.5 flex items-center justify-between text-xs"
        aria-live="polite"
      >
        <span className={enough ? "font-semibold text-brand-700" : "text-muted"}>
          {labels.words.replace("{count}", String(words))} ·{" "}
          {labels.minWords.replace("{min}", String(minWords))}
        </span>
        {enough && <span className="font-semibold text-brand-700">✓</span>}
      </div>

      {state.error && (
        <p className={errorClass} role="alert">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-800" role="status">
          ✓ {labels.savedNote}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={buttonClass("primary") + " mt-4"}
      >
        {pending ? labels.submitting : labels.submit}
      </button>
    </form>
  );
}
