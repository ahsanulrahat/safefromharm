"use client";

import { useActionState } from "react";
import {
  createAdminAction,
  resetAdminPasswordAction,
  setAdminActiveAction,
  softDeleteAdminAction,
  updateAdminAction,
  type AdminActionState,
} from "@/actions/admin-accounts";
import { buttonClass, cardClass, inputClass, labelClass } from "@/components/ui";
import type { AdminRole } from "@prisma/client";
import type { AppLocale } from "@/i18n/routing";

const empty: AdminActionState = {};

type Labels = {
  create: string; name: string; loginId: string; email: string; role: string; password: string;
  createButton: string; accountList: string; active: string; disabled: string; deleted: string;
  save: string; reset: string; disable: string; enable: string; delete: string; temporaryPassword: string;
  copyWarning: string; confirmPassword: string; created: string; updated: string; deletedMessage: string;
  resetReady: string; mustChange: string; confirmDisable: string; confirmEnable: string; confirmDelete: string;
  roles: Record<string, string>; errors: Record<string, string>;
};

type RecordData = {
  id: string; name: string; loginId: string; email: string; role: AdminRole;
  isActive: boolean; deletedAt: Date | null; mustChangePassword: boolean;
};

function Feedback({ state, labels, success }: { state: AdminActionState; labels: Labels; success?: string }) {
  if (state.error) return <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{labels.errors[state.error] ?? state.error}</p>;
  if (state.message) return <p role="status" className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-900">{success ?? labels.updated}{state.detail ? ` ${state.detail}` : ""}</p>;
  return null;
}

function OneTimePassword({ state, labels }: { state: AdminActionState; labels: Labels }) {
  if (!state.oneTimePassword) return null;
  return <div role="status" className="rounded-xl border border-gold-300 bg-gold-50 p-3"><p className="text-sm font-bold text-gold-900">{labels.temporaryPassword}</p><code className="mt-2 block break-all rounded bg-white p-3 font-mono text-sm text-brand-950">{state.oneTimePassword}</code><p className="mt-2 text-xs text-gold-900">{labels.copyWarning}</p></div>;
}

function RoleSelect({ labels, name = "role", value = "REPORTING_ADMIN" }: { labels: Labels; name?: string; value?: string }) {
  return <select name={name} defaultValue={value} className={inputClass} required>
    <option value="SUPERADMIN">{labels.roles.SUPERADMIN}</option>
    <option value="CONTENT_MANAGER">{labels.roles.CONTENT_MANAGER}</option>
    <option value="SAFEGUARDING_REVIEWER">{labels.roles.SAFEGUARDING_REVIEWER}</option>
    <option value="REPORTING_ADMIN">{labels.roles.REPORTING_ADMIN}</option>
  </select>;
}

export function CreateAdminForm({ locale, labels }: { locale: AppLocale; labels: Labels }) {
  const [state, action, pending] = useActionState(createAdminAction, empty);
  return <section className={cardClass}>
    <h2 className="text-lg font-bold text-brand-950">{labels.create}</h2>
    <form action={action} className="mt-4 grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="locale" value={locale} />
      <div><label className={labelClass}>{labels.name}</label><input name="name" className={inputClass} minLength={2} maxLength={120} required /></div>
      <div><label className={labelClass}>{labels.loginId}</label><input name="loginId" className={inputClass} autoComplete="username" maxLength={120} required /></div>
      <div><label className={labelClass}>{labels.email}</label><input name="email" type="email" className={inputClass} maxLength={254} required /></div>
      <div><label className={labelClass}>{labels.role}</label><RoleSelect labels={labels} /></div>
      <div className="sm:col-span-2"><label className={labelClass}>{labels.password}</label><input name="currentPassword" type="password" autoComplete="current-password" className={inputClass} required /></div>
      <div className="space-y-3 sm:col-span-2"><Feedback state={state} labels={labels} success={labels.created} /><OneTimePassword state={state} labels={labels} /><button disabled={pending} className={buttonClass("primary")}>{labels.createButton}</button></div>
    </form>
  </section>;
}

function AdminRecordCard({ locale, record, labels }: { locale: AppLocale; record: RecordData; labels: Labels }) {
  const [editState, editAction, editPending] = useActionState(updateAdminAction, empty);
  const [resetState, resetAction, resetPending] = useActionState(resetAdminPasswordAction, empty);
  const [accessState, accessAction, accessPending] = useActionState(setAdminActiveAction, empty);
  const [deleteState, deleteAction, deletePending] = useActionState(softDeleteAdminAction, empty);
  const role = record.role === "SAFEGUARDING" ? "SAFEGUARDING_REVIEWER" : record.role === "VIEWER" ? "REPORTING_ADMIN" : record.role;
  return <article className={cardClass + " space-y-5"}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="font-bold text-brand-950">{record.name}</h3><p className="text-sm text-muted">{record.email} · {record.loginId}</p><p className="mt-1 text-xs font-semibold text-brand-700">{labels.roles[role]} · {record.deletedAt ? labels.deleted : record.isActive ? labels.active : labels.disabled}{record.mustChangePassword ? ` · ${labels.mustChange}` : ""}</p></div>
    </div>
    {!record.deletedAt && <>
      <form action={editAction} className="grid gap-3 border-t border-brand-100 pt-4 sm:grid-cols-2">
        <input type="hidden" name="id" value={record.id} /><input type="hidden" name="locale" value={locale} />
        <div><label className={labelClass}>{labels.name}</label><input name="name" defaultValue={record.name} className={inputClass} minLength={2} maxLength={120} required /></div>
        <div><label className={labelClass}>{labels.loginId}</label><input name="loginId" defaultValue={record.loginId} className={inputClass} maxLength={120} required /></div>
        <div><label className={labelClass}>{labels.email}</label><input name="email" type="email" defaultValue={record.email} className={inputClass} maxLength={254} required /></div>
        <div><label className={labelClass}>{labels.role}</label><RoleSelect labels={labels} value={role} /></div>
        <div className="sm:col-span-2"><label className={labelClass}>{labels.confirmPassword}</label><input name="currentPassword" type="password" autoComplete="current-password" className={inputClass} required /></div>
        <div className="space-y-2 sm:col-span-2"><Feedback state={editState} labels={labels} success={labels.updated} /><button disabled={editPending} className={buttonClass("secondary")}>{labels.save}</button></div>
      </form>
      <form action={resetAction} className="grid gap-3 border-t border-brand-100 pt-4 sm:grid-cols-[1fr_auto]">
        <input type="hidden" name="id" value={record.id} /><input type="hidden" name="locale" value={locale} />
        <div><label className={labelClass}>{labels.confirmPassword}</label><input name="currentPassword" type="password" autoComplete="current-password" className={inputClass} required /></div>
        <button disabled={resetPending} className={buttonClass("secondary") + " self-end"}>{labels.reset}</button>
        <div className="space-y-2 sm:col-span-2"><Feedback state={resetState} labels={labels} success={labels.resetReady} /><OneTimePassword state={resetState} labels={labels} /></div>
      </form>
      <form action={accessAction} onSubmit={(event) => { if (!window.confirm(record.isActive ? labels.confirmDisable : labels.confirmEnable)) event.preventDefault(); }} className="grid gap-3 border-t border-brand-100 pt-4 sm:grid-cols-[1fr_auto]">
        <input type="hidden" name="id" value={record.id} /><input type="hidden" name="enable" value={String(!record.isActive)} /><input type="hidden" name="locale" value={locale} />
        <div><label className={labelClass}>{labels.confirmPassword}</label><input name="currentPassword" type="password" autoComplete="current-password" className={inputClass} required /></div>
        <button disabled={accessPending} className={buttonClass(record.isActive ? "secondary" : "primary") + " self-end"}>{record.isActive ? labels.disable : labels.enable}</button>
        <div className="sm:col-span-2"><Feedback state={accessState} labels={labels} success={labels.updated} /></div>
      </form>
      <form action={deleteAction} onSubmit={(event) => { if (!window.confirm(labels.confirmDelete)) event.preventDefault(); }} className="grid gap-3 border-t border-red-100 pt-4 sm:grid-cols-[1fr_auto]">
        <input type="hidden" name="id" value={record.id} /><input type="hidden" name="locale" value={locale} />
        <div><label className={labelClass}>{labels.confirmPassword}</label><input name="currentPassword" type="password" autoComplete="current-password" className={inputClass} required /></div>
        <button disabled={deletePending} className="self-end rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">{labels.delete}</button>
        <div className="sm:col-span-2"><Feedback state={deleteState} labels={labels} success={labels.deletedMessage} /></div>
      </form>
    </>}
  </article>;
}

export function AdminManagement({ locale, records, ownId, labels }: { locale: AppLocale; records: RecordData[]; ownId: string; labels: Labels }) {
  return <div className="space-y-6"><CreateAdminForm locale={locale} labels={labels} /><section><h2 className="mb-3 text-xl font-bold text-brand-950">{labels.accountList}</h2><div className="space-y-4">{records.filter((record) => record.id !== ownId).map((record) => <AdminRecordCard key={record.id} locale={locale} record={record} labels={labels} />)}</div></section></div>;
}
