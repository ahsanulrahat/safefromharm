import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { AdminProfileForm, RevokeSessionsForm, type AccountLabels } from "@/components/admin/admin-account-forms";
import { cardClass } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("admin.account");
  return { title: t("title"), robots: { index: false } };
}

export default async function AdminAccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const admin = await requireAdmin(locale);
  const search = await searchParams;
  const [t, row, sessions] = await Promise.all([
    getTranslations("admin.account"),
    prisma.adminUser.findUnique({ where: { id: admin.id }, select: { name: true, loginId: true, email: true } }),
    prisma.adminSession.findMany({
      where: { adminId: admin.id, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, createdAt: true, expiresAt: true, ipAddress: true, userAgent: true },
    }),
  ]);
  if (!row) return null;

  const errorCodes = [
    "SESSION_EXPIRED", "PASSWORD_CHANGE_REQUIRED", "CURRENT_PASSWORD", "NAME_INVALID", "EMAIL_INVALID",
    "LOGIN_INVALID", "LOGIN_TAKEN", "EMAIL_TAKEN", "ACCOUNT_MISSING", "PASSWORD_LENGTH",
    "PASSWORD_MISMATCH", "REAUTH", "ADMIN_DETAILS", "DUPLICATE", "SELF_ROLE", "SELF_ACCESS",
    "LAST_SUPERADMIN", "ADMIN_MISSING", "ADMIN_INACTIVE",
  ] as const;
  const errors = Object.fromEntries(errorCodes.map((code) => [code, t(`errors.${code}`)]));
  const labels: AccountLabels = {
    profile: t("profile"), name: t("name"), loginId: t("loginId"), email: t("email"),
    currentPassword: t("currentPassword"), saveProfile: t("saveProfile"), passwordTitle: t("passwordTitle"),
    newPassword: t("newPassword"), confirmPassword: t("confirmPassword"), changePassword: t("changePassword"),
    updated: t("updated"), errors,
  };
  const revokedCount = typeof search.revoked === "string" ? search.revoked : "";

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight text-brand-950 sm:text-3xl">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      {revokedCount !== "" && <p role="status" className="mt-4 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-900">{t("sessionsRevoked")} ({revokedCount})</p>}
      <div className="mt-6"><AdminProfileForm locale={locale} admin={row} labels={labels} /></div>
      <section className={cardClass + " mt-6"}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="text-lg font-bold text-brand-950">{t("sessions")}</h2><p className="mt-1 text-sm text-muted">{t("sessionInfo")}</p></div>
          <RevokeSessionsForm locale={locale} label={t("revokeOthers")} />
        </div>
        <ul className="mt-4 divide-y divide-brand-100">
          {sessions.map((session) => (
            <li key={session.id} className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm">
              <div className="min-w-0"><p className="font-semibold text-brand-950">{session.id === admin.sessionId ? t("thisDevice") : session.userAgent || "Browser session"}</p><p className="mt-1 break-all text-xs text-muted">{session.id === admin.sessionId ? session.userAgent : session.ipAddress}</p></div>
              <p className="shrink-0 text-xs text-muted">{formatDateTime(session.createdAt, locale)} · {formatDateTime(session.expiresAt, locale)}</p>
            </li>
          ))}
          {sessions.length === 0 && <li className="py-5 text-sm text-muted">{t("noSessions")}</li>}
        </ul>
      </section>
    </div>
  );
}
