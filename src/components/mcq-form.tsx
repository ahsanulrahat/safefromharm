"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { submitMcqAction, type ProgressState } from "@/actions/progress";
import { buttonClass, cardClass, errorClass } from "@/components/ui";
import { CheckIcon } from "@/components/icons";

const initialState: ProgressState = {};

type Option = { id: string; label: string };

export function McqForm({
  moduleSlug,
  stepId,
  prompt,
  options,
  existingOptionId,
  labels,
}: {
  moduleSlug: string;
  stepId: string;
  prompt: string;
  options: Option[];
  existingOptionId?: string;
  labels: {
    submit: string;
    submitting: string;
    correct: string;
    incorrect: string;
    answeredNote: string;
  };
}) {
  const [state, action, pending] = useActionState(submitMcqAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.ok) router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok, state.correct]);

  return (
    <form action={action} className={cardClass}>
      <input type="hidden" name="moduleSlug" value={moduleSlug} />
      <input type="hidden" name="stepId" value={stepId} />
      <fieldset>
        <legend className="text-base font-bold leading-snug text-brand-950 dark:text-brand-50 sm:text-lg">
          {prompt}
        </legend>
        <div className="mt-4 space-y-3">
          {options.map((option) => (
            <label
              key={option.id}
              className="group relative flex cursor-pointer items-start gap-3.5 rounded-xl border border-brand-200/80 bg-white/70 p-3.5 text-sm font-medium text-brand-950 shadow-xs transition-all duration-200 hover:border-brand-400 hover:bg-brand-50/40 hover:shadow-sm has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50/90 has-[:checked]:shadow-xs has-[:checked]:ring-2 has-[:checked]:ring-brand-500/20 dark:border-brand-800 dark:bg-brand-950/60 dark:text-brand-100 dark:hover:bg-brand-900/40 dark:has-[:checked]:border-brand-500 dark:has-[:checked]:bg-brand-900/60"
            >
              <input
                type="radio"
                name="optionId"
                value={option.id}
                required
                defaultChecked={existingOptionId === option.id}
                className="mt-0.5 h-4 w-4 shrink-0 border-brand-300 text-brand-700 accent-brand-700 transition focus:ring-brand-400"
              />
              <span className="leading-relaxed transition-colors group-hover:text-brand-900 dark:group-hover:text-white group-has-[:checked]:font-semibold group-has-[:checked]:text-brand-950 dark:group-has-[:checked]:text-white">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {state.error && (
        <p className={errorClass} role="alert">
          {state.error}
        </p>
      )}

      {state.ok && state.correct !== undefined && (
        <div
          className={
            "mt-4 flex items-start gap-2.5 rounded-xl border p-3.5 text-sm font-semibold transition-all " +
            (state.correct
              ? "border-brand-200 bg-brand-50/90 text-brand-900 dark:border-brand-800 dark:bg-brand-900/60 dark:text-brand-200"
              : "border-gold-300 bg-gold-50/90 text-gold-950 dark:border-gold-800 dark:bg-gold-950/60 dark:text-gold-200")
          }
          role="status"
          aria-live="polite"
        >
          {state.correct && (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-xs">
              <CheckIcon className="h-3 w-3" />
            </span>
          )}
          <div>
            <span>{state.correct ? labels.correct : labels.incorrect}</span>
            {existingOptionId && (
              <span className="mt-1 block text-xs font-normal opacity-85">
                {labels.answeredNote}
              </span>
            )}
          </div>
        </div>
      )}

      {state.ok && state.correct === undefined && (
        <p className="mt-3.5 text-sm font-medium text-brand-800 dark:text-brand-300" role="status">
          {labels.answeredNote}
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
