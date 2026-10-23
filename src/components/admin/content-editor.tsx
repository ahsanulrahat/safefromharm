"use client";

import { useActionState, useState } from "react";
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
};

export function ContentEditor({
  locale,
  originalSlug,
  initialJson,
  labels,
}: {
  locale: AppLocale;
  originalSlug: string;
  initialJson: string;
  labels: ContentEditorLabels;
}) {
  const [state, action, pending] = useActionState(saveModuleAction, initialState);
  const [value, setValue] = useState(initialJson);
  const [formatError, setFormatError] = useState<string | null>(null);

  function formatJson() {
    try {
      setValue(JSON.stringify(JSON.parse(value), null, 2));
      setFormatError(null);
    } catch {
      setFormatError(labels.formatError);
    }
  }

  return (
    <form action={action} className="mt-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="originalSlug" value={originalSlug} />

      {state.error && (
        <div
          role="alert"
          className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800"
        >
          {state.error}
        </div>
      )}
      {state.fieldErrors && state.fieldErrors.length > 0 && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <p className="font-semibold">{labels.validationTitle}</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs">
            {state.fieldErrors.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      <label className="text-sm font-semibold text-brand-900" htmlFor="module-json">
        {labels.jsonLabel}
      </label>
      <textarea
        id="module-json"
        name="json"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        spellCheck={false}
        rows={30}
        className={
          inputClass +
          " mt-1 min-h-[28rem] resize-y font-mono text-xs leading-relaxed"
        }
      />
      {formatError && (
        <p className="mt-1 text-sm font-medium text-red-700">{formatError}</p>
      )}
      <p className="mt-1 text-xs text-muted">{labels.idNote}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className={buttonClass("primary")}
        >
          {pending ? labels.saving : labels.save}
        </button>
        <button
          type="button"
          onClick={formatJson}
          className={buttonClass("secondary")}
        >
          {labels.format}
        </button>
        <Link href="/admin/content" className={buttonClass("ghost")}>
          {labels.cancel}
        </Link>
      </div>
    </form>
  );
}
