"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { registerAction, type RegisterState } from "@/actions/register";
import { buttonClass, errorClass, hintClass, inputClass, labelClass } from "@/components/ui";
import type { AppLocale } from "@/i18n/routing";

const initialState: RegisterState = {};

export function RegisterForm({ locale }: { locale: AppLocale }) {
  const t = useTranslations("register");
  const [state, action, pending] = useActionState(registerAction, initialState);

  function fieldError(name: string) {
    return state.fieldErrors?.[name];
  }

  function errorProps(name: string) {
    const message = fieldError(name);
    return {
      "aria-invalid": Boolean(message),
      "aria-describedby": message ? `${name}-error` : undefined,
    } as const;
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {state.error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50/90 p-4 text-sm font-semibold text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
        >
          {state.error}
        </div>
      )}

      {state.fieldErrors && (
        <p className="text-sm font-semibold text-red-700 dark:text-red-300" role="status">
          {t("errorTitle")}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="fullNameBn">
            {t("fullNameBn")} <span aria-hidden="true">*</span>
          </label>
          <input
            id="fullNameBn"
            name="fullNameBn"
            type="text"
            required
            autoComplete="name"
            lang="bn"
            defaultValue={state.values?.fullNameBn}
            className={inputClass}
            {...errorProps("fullNameBn")}
          />
          <p className={hintClass}>{t("fullNameBnHint")}</p>
          {fieldError("fullNameBn") && (
            <p id="fullNameBn-error" className={errorClass}>
              {fieldError("fullNameBn")}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="nameEn">
            {t("nameEn")} <span aria-hidden="true">*</span>
          </label>
          <input
            id="nameEn"
            name="nameEn"
            type="text"
            required
            autoComplete="off"
            spellCheck={false}
            pattern="[A-Za-z][A-Za-z .'\-]{1,79}"
            defaultValue={state.values?.nameEn}
            className={inputClass}
            {...errorProps("nameEn")}
          />
          <p className={hintClass}>{t("nameEnHint")}</p>
          {fieldError("nameEn") && (
            <p id="nameEn-error" className={errorClass}>
              {fieldError("nameEn")}
            </p>
          )}
        </div>

        <div>
          <label className={labelClass} htmlFor="scoutId">
            {t("scoutId")} <span aria-hidden="true">*</span>
          </label>
          <input
            id="scoutId"
            name="scoutId"
            type="text"
            required
            autoCapitalize="characters"
            autoComplete="off"
            defaultValue={state.values?.scoutId}
            className={inputClass}
            {...errorProps("scoutId")}
          />
          <p className={hintClass}>{t("scoutIdHint")}</p>
          {fieldError("scoutId") && (
            <p id="scoutId-error" className={errorClass}>
              {fieldError("scoutId")}
            </p>
          )}
        </div>

        <div>
          <label className={labelClass} htmlFor="unit">
            {t("unit")} <span aria-hidden="true">*</span>
          </label>
          <input
            id="unit"
            name="unit"
            type="text"
            required
            autoComplete="organization"
            defaultValue={state.values?.unit}
            className={inputClass}
            {...errorProps("unit")}
          />
          {fieldError("unit") && (
            <p id="unit-error" className={errorClass}>
              {fieldError("unit")}
            </p>
          )}
        </div>

        <div>
          <label className={labelClass} htmlFor="district">
            {t("district")} <span aria-hidden="true">*</span>
          </label>
          <input
            id="district"
            name="district"
            type="text"
            required
            autoComplete="address-level1"
            defaultValue={state.values?.district}
            className={inputClass}
            {...errorProps("district")}
          />
          {fieldError("district") && (
            <p id="district-error" className={errorClass}>
              {fieldError("district")}
            </p>
          )}
        </div>

        <div>
          <label className={labelClass} htmlFor="memberType">
            {t("memberType")} <span aria-hidden="true">*</span>
          </label>
          <select
            id="memberType"
            name="memberType"
            required
            defaultValue={state.values?.memberType ?? ""}
            className={inputClass}
            {...errorProps("memberType")}
          >
            <option value="" disabled>
              {t("memberTypePlaceholder")}
            </option>
            <option value="ROVER">{t("memberTypes.rover")}</option>
            <option value="LEADER">{t("memberTypes.leader")}</option>
          </select>
          {fieldError("memberType") && (
            <p id="memberType-error" className={errorClass}>
              {fieldError("memberType")}
            </p>
          )}
        </div>

        <div>
          <label className={labelClass} htmlFor="phone">
            {t("phone")}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            defaultValue={state.values?.phone}
            className={inputClass}
            {...errorProps("phone")}
          />
          {fieldError("phone") && (
            <p id="phone-error" className={errorClass}>
              {fieldError("phone")}
            </p>
          )}
        </div>

        <div>
          <label className={labelClass} htmlFor="email">
            {t("email")}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            defaultValue={state.values?.email}
            className={inputClass}
            {...errorProps("email")}
          />
          {fieldError("email") && (
            <p id="email-error" className={errorClass}>
              {fieldError("email")}
            </p>
          )}
        </div>
        <p className="text-xs text-muted dark:text-brand-300 sm:col-span-2">{t("contactHint")}</p>
      </div>

      <fieldset className="space-y-3 rounded-2xl border border-brand-100 bg-brand-50/50 p-4 sm:p-5 dark:border-brand-900/80 dark:bg-brand-950/40">
        <legend className="px-1 text-sm font-bold text-brand-950 dark:text-brand-100">
          {t("consentTitle")}
        </legend>
        <label className="flex items-start gap-3 text-sm font-medium text-brand-950 dark:text-brand-100 cursor-pointer">
          <input
            type="checkbox"
            name="consent"
            defaultChecked={state.values?.consent === "on"}
            className="mt-0.5 h-5 w-5 rounded border-brand-300 text-brand-700 accent-brand-700 focus:ring-brand-300"
            aria-describedby="consent-error"
          />
          <span className="leading-relaxed">
            {t("consent")}
            {fieldError("consent") && (
              <span id="consent-error" className="mt-1 block text-sm font-semibold text-red-600 dark:text-red-400" role="alert">
                {fieldError("consent")}
              </span>
            )}
          </span>
        </label>
      </fieldset>

      <button type="submit" disabled={pending} className={buttonClass("primary") + " w-full py-3.5 shadow-sm"}>
        {pending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
