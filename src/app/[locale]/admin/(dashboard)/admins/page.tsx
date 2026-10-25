import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { AdminManagement } from "@/components/admin/admin-management";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("admin.admins");
  return { title: t("title"), robots: { index: false } };
}

export default async function AdminManagementPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  const actor = await requireAdmin(locale, "admins:read");
  const [t, rows] = await Promise.all([
    getTranslations("admin.admins"),
    prisma.adminUser.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      take: 200,
      select: { id: true, name: true, loginId: true, email: true, role: true, isActive: true, deletedAt: true, mustChangePassword: true },
    }),
  ]);
  const codes = [
    "SESSION_EXPIRED", "PASSWORD_CHANGE_REQUIRED", "CURRENT_PASSWORD", "NAME_INVALID", "EMAIL_INVALID",
    "LOGIN_INVALID", "LOGIN_TAKEN", "EMAIL_TAKEN", "ACCOUNT_MISSING", "PASSWORD_LENGTH",
    "PASSWORD_MISMATCH", "REAUTH", "ADMIN_DETAILS", "DUPLICATE", "SELF_ROLE", "SELF_ACCESS",
    "LAST_SUPERADMIN", "ADMIN_MISSING", "ADMIN_INACTIVE",
  ] as const;
  const labels = {
    create: t("create"), name: t("name"), loginId: t("loginId"), email: t("email"), role: t("role"),
    password: t("password"), createButton: t("createButton"), accountList: t("accountList"),
    active: t("active"), disabled: t("disabled"), deleted: t("deleted"), save: t("save"), reset: t("reset"),
    disable: t("disable"), enable: t("enable"), delete: t("delete"), temporaryPassword: t("temporaryPassword"),
    copyWarning: t("copyWarning"), confirmPassword: t("confirmPassword"), created: t("created"), updated: t("updated"),
    deletedMessage: t("deletedMessage"), resetReady: t("resetReady"), mustChange: t("mustChange"),
    confirmDisable: t("confirmDisable"), confirmEnable: t("confirmEnable"), confirmDelete: t("confirmDelete"),
    roles: {
      SUPERADMIN: t("roleSuperadmin"), CONTENT_MANAGER: t("roleContent"),
      SAFEGUARDING_REVIEWER: t("roleSafeguarding"), REPORTING_ADMIN: t("roleReporting"),
    },
    errors: Object.fromEntries(codes.map((code) => [code, t(`errors.${code}`)])),
  };
  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight text-brand-950 sm:text-3xl">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      <div className="mt-6"><AdminManagement locale={locale} records={rows} ownId={actor.id} labels={labels} /></div>
    </div>
  );
}
