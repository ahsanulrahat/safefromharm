"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  resumeWithCodeAction,
  resumeWithIdAction,
  type ResumeState,
} from "@/actions/resume";
import { buttonClass, hintClass, inputClass, labelClass } from "@/components/ui";
import type { AppLocale } from "@/i18n/routing";

const initialState: ResumeState = {};

function ErrorBox({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800"
    >
      {message}
    </div>
  );
}

export function ResumeForms({ locale }: { locale: AppLocale }) {
  const t = useTranslations("resume");
  const [codeState, codeAction, codePending] = useActionState(
    resumeWithCodeAction,
    initialState
  );
  const [idState, idAction, idPending] = useActionState(
    resumeWithIdAction,
    initialState
  );

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <form
        action={codeAction}
        className="space-y-4 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm"
        noValidate
      >
        <input type="hidden" name="locale" value={locale} />
        <div>
          <h2 className="text-lg font-bold text-brand-950">{t("codeTitle")}</h2>
          <p className="mt-1 text-sm text-muted">{t("codeHint")}</p>
        </div>
        <ErrorBox message={codeState.error} />
        <div>
          <label className={labelClass} htmlFor="resume-code">
            {t("codeLabel")}
          </label>
          <input
            id="resume-code"
            name="code"
            type="text"
            autoCapitalize="characters"
            autoComplete="one-time-code"
            spellCheck={false}
            required
            className={inputClass + " font-mono uppercase"}
          />
        </div>
        <button
          type="submit"
          disabled={codePending}
          className={buttonClass("primary") + " w-full"}
        >
          {codePending ? t("submitting") : t("submit")}
        </button>
      </form>

      <form
        action={idAction}
        className="space-y-4 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm"
        noValidate
      >
        <input type="hidden" name="locale" value={locale} />
        <div>
          <h2 className="text-lg font-bold text-brand-950">{t("idTitle")}</h2>
          <p className="mt-1 text-sm text-muted">{t("idHint")}</p>
        </div>
        <ErrorBox message={idState.error} />
        <div>
          <label className={labelClass} htmlFor="resume-scout-id">
            {t("scoutId")}
          </label>
          <input
            id="resume-scout-id"
            name="scoutId"
            type="text"
            autoCapitalize="characters"
            autoComplete="off"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="resume-contact">
            {t("contact")}
          </label>
          <input
            id="resume-contact"
            name="contact"
            type="text"
            autoComplete="email"
            required
            className={inputClass}
            aria-describedby="resume-contact-hint"
          />
          <p id="resume-contact-hint" className={hintClass}>
            {t("contactHint")}
          </p>
        </div>
        <button
          type="submit"
          disabled={idPending}
          className={buttonClass("primary") + " w-full"}
        >
          {idPending ? t("submitting") : t("submit")}
        </button>
      </form>
    </div>
  );
}
