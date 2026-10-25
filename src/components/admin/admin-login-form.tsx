"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { loginAction, type LoginState } from "@/actions/auth";
import { buttonClass, inputClass, labelClass } from "@/components/ui";
import type { AppLocale } from "@/i18n/routing";

const initialState: LoginState = {};

export function AdminLoginForm({
  locale,
  callbackUrl,
}: {
  locale: AppLocale;
  callbackUrl?: string;
}) {
  const t = useTranslations("admin.login");
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      {callbackUrl ? (
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
      ) : null}
      {state.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800"
        >
          {state.error}
        </div>
      )}
      <div>
        <label className={labelClass} htmlFor="admin-email">
          {t("email")}
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="admin-password">
          {t("password")}
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className={buttonClass("primary") + " w-full"}
      >
        {pending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
