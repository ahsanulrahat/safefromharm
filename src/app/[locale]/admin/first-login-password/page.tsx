import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin";
import { FirstLoginPasswordForm, type AccountLabels } from "@/components/admin/admin-account-forms";
import { LocaleControls } from "@/components/locale-controls";
import type { AppLocale } from "@/i18n/routing";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function FirstLoginPasswordPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  const admin = await requireAdmin(locale, undefined, { allowMustChangePassword: true });
  if (!admin.mustChangePassword) redirect(`/${locale}/admin/account`);
  const t = await getTranslations("admin.account");
  const codes = [
    "SESSION_EXPIRED", "PASSWORD_CHANGE_REQUIRED", "CURRENT_PASSWORD", "NAME_INVALID", "EMAIL_INVALID",
    "LOGIN_INVALID", "LOGIN_TAKEN", "EMAIL_TAKEN", "ACCOUNT_MISSING", "PASSWORD_LENGTH",
    "PASSWORD_MISMATCH", "REAUTH", "ADMIN_DETAILS", "DUPLICATE", "SELF_ROLE", "SELF_ACCESS",
    "LAST_SUPERADMIN", "ADMIN_MISSING", "ADMIN_INACTIVE",
  ] as const;
  const labels: AccountLabels & { forceTitle: string; forceHint: string } = {
    profile: t("profile"), name: t("name"), loginId: t("loginId"), email: t("email"),
    currentPassword: t("currentPassword"), saveProfile: t("saveProfile"), passwordTitle: t("passwordTitle"),
    newPassword: t("newPassword"), confirmPassword: t("confirmPassword"), changePassword: t("changePassword"),
    updated: t("updated"), errors: Object.fromEntries(codes.map((code) => [code, t(`errors.${code}`)])),
    forceTitle: t("forceTitle"), forceHint: t("forceHint"),
  };
  return <main className="min-h-[70vh] px-4 py-12"><div className="mx-auto flex max-w-lg justify-end"><LocaleControls locale={locale} /></div><div className="mt-6"><FirstLoginPasswordForm locale={locale} labels={labels} /></div></main>;
}
