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
        <legend className="text-base font-semibold leading-snug text-brand-950">
          {prompt}
        </legend>
        <div className="mt-4 space-y-2.5">
          {options.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-brand-100 bg-cream/50 px-3 py-3 text-sm text-brand-950 transition hover:border-brand-300 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50"
            >
              <input
                type="radio"
                name="optionId"
                value={option.id}
                required
                defaultChecked={existingOptionId === option.id}
                className="mt-0.5 h-4 w-4 border-brand-300 text-brand-700 focus:ring-brand-300"
              />
              <span>{option.label}</span>
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
            "mt-4 flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold " +
            (state.correct
              ? "bg-brand-50 text-brand-800"
              : "bg-gold-50 text-gold-900")
          }
          role="status"
          aria-live="polite"
        >
          {state.correct && <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>
            {state.correct ? labels.correct : labels.incorrect}
            {existingOptionId && (
              <span className="mt-1 block text-xs font-normal opacity-80">
                {labels.answeredNote}
              </span>
            )}
          </span>
        </div>
      )}

      {state.ok && state.correct === undefined && (
        <p className="mt-3 text-sm font-medium text-brand-800" role="status">
          {labels.answeredNote}
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
