"use client";

import { useActionState } from "react";
import {
  changeOwnAdminPasswordAction,
  revokeOtherAdminSessionsAction,
  updateOwnAdminAccountAction,
  type AdminActionState,
} from "@/actions/admin-accounts";
import { buttonClass, cardClass, inputClass, labelClass } from "@/components/ui";
import type { AppLocale } from "@/i18n/routing";

const emptyState: AdminActionState = {};

export type AccountLabels = {
  profile: string;
  name: string;
  loginId: string;
  email: string;
  currentPassword: string;
  saveProfile: string;
  passwordTitle: string;
  newPassword: string;
  confirmPassword: string;
  changePassword: string;
  updated: string;
  errors: Record<string, string>;
};

function Feedback({
  state,
  labels,
}: {
  state: AdminActionState;
  labels: AccountLabels;
}) {
  if (state.error) {
    return (
      <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
        {labels.errors[state.error] ?? state.error}
      </p>
    );
  }
  if (state.message) {
    return <p role="status" className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-900">{labels.updated}</p>;
  }
  return null;
}

export function AdminProfileForm({
  locale,
  admin,
  labels,
}: {
  locale: AppLocale;
  admin: { name: string; email: string; loginId: string };
  labels: AccountLabels;
}) {
  const [profileState, profileAction, profilePending] = useActionState(updateOwnAdminAccountAction, emptyState);
  const [passwordState, passwordAction, passwordPending] = useActionState(changeOwnAdminPasswordAction, emptyState);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className={cardClass}>
        <h2 className="text-lg font-bold text-brand-950">{labels.profile}</h2>
        <form action={profileAction} className="mt-4 space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <div><label className={labelClass} htmlFor="admin-name">{labels.name}</label><input id="admin-name" name="name" className={inputClass} defaultValue={admin.name} minLength={2} maxLength={120} required /></div>
          <div><label className={labelClass} htmlFor="admin-login-id">{labels.loginId}</label><input id="admin-login-id" name="loginId" className={inputClass} defaultValue={admin.loginId} autoComplete="username" maxLength={120} required /></div>
          <div><label className={labelClass} htmlFor="admin-account-email">{labels.email}</label><input id="admin-account-email" name="email" type="email" className={inputClass} defaultValue={admin.email} autoComplete="email" maxLength={254} required /></div>
          <div><label className={labelClass} htmlFor="profile-current-password">{labels.currentPassword}</label><input id="profile-current-password" name="currentPassword" type="password" className={inputClass} autoComplete="current-password" required /></div>
          <Feedback state={profileState} labels={labels} />
          <button className={buttonClass("primary")} disabled={profilePending}>{labels.saveProfile}</button>
        </form>
      </section>

      <section className={cardClass}>
        <h2 className="text-lg font-bold text-brand-950">{labels.passwordTitle}</h2>
        <form action={passwordAction} className="mt-4 space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <div><label className={labelClass} htmlFor="password-current">{labels.currentPassword}</label><input id="password-current" name="currentPassword" type="password" className={inputClass} autoComplete="current-password" required /></div>
          <div><label className={labelClass} htmlFor="password-new">{labels.newPassword}</label><input id="password-new" name="newPassword" type="password" className={inputClass} autoComplete="new-password" minLength={12} maxLength={256} required /></div>
          <div><label className={labelClass} htmlFor="password-confirm">{labels.confirmPassword}</label><input id="password-confirm" name="confirmPassword" type="password" className={inputClass} autoComplete="new-password" minLength={12} maxLength={256} required /></div>
          <Feedback state={passwordState} labels={labels} />
          <button className={buttonClass("primary")} disabled={passwordPending}>{labels.changePassword}</button>
        </form>
      </section>
    </div>
  );
}

export function FirstLoginPasswordForm({
  locale,
  labels,
}: {
  locale: AppLocale;
  labels: AccountLabels & { forceTitle: string; forceHint: string };
}) {
  const [state, action, pending] = useActionState(changeOwnAdminPasswordAction, emptyState);
  return (
    <section className={cardClass + " mx-auto max-w-lg"}>
      <h1 className="text-2xl font-black text-brand-950">{labels.forceTitle}</h1>
      <p className="mt-2 text-sm text-muted">{labels.forceHint}</p>
      <form action={action} className="mt-5 space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <div><label className={labelClass} htmlFor="force-current">{labels.currentPassword}</label><input id="force-current" name="currentPassword" type="password" autoComplete="current-password" className={inputClass} required /></div>
        <div><label className={labelClass} htmlFor="force-new">{labels.newPassword}</label><input id="force-new" name="newPassword" type="password" autoComplete="new-password" className={inputClass} minLength={12} maxLength={256} required /></div>
        <div><label className={labelClass} htmlFor="force-confirm">{labels.confirmPassword}</label><input id="force-confirm" name="confirmPassword" type="password" autoComplete="new-password" className={inputClass} minLength={12} maxLength={256} required /></div>
        <Feedback state={state} labels={labels} />
        <button className={buttonClass("primary") + " w-full"} disabled={pending}>{labels.changePassword}</button>
      </form>
    </section>
  );
}

export function RevokeSessionsForm({ locale, label }: { locale: AppLocale; label: string }) {
  return <form action={revokeOtherAdminSessionsAction}><input type="hidden" name="locale" value={locale} /><button className={buttonClass("secondary")}>{label}</button></form>;
}
