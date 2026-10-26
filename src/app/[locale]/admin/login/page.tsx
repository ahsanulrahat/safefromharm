import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getAdmin } from "@/lib/admin";
import { safeAdminCallback } from "@/lib/admin-callback";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { CompassMark } from "@/components/icons";
import type { AppLocale } from "@/i18n/routing";
import { LocaleControls } from "@/components/locale-controls";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("admin.login");
  return { title: t("title"), robots: { index: false } };
}

export default async function AdminLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const search = await searchParams;
  const rawCallback = Array.isArray(search.callbackUrl)
    ? search.callbackUrl[0]
    : search.callbackUrl;
  const callbackUrl = safeAdminCallback(locale, rawCallback);

  const admin = await getAdmin();
  if (admin) redirect(callbackUrl);

  const t = await getTranslations("admin.login");
  const tc = await getTranslations("common");

  return (
    <div className="relative mx-auto max-w-md px-4 py-14 sm:px-6 sm:py-20">
      <div className="absolute right-4 top-3 flex items-center gap-2 sm:right-6">
        <LocaleControls locale={locale} />
      </div>
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
          <CompassMark className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-2xl font-black text-brand-950">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </div>

      <div className="mt-6 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <AdminLoginForm locale={locale} callbackUrl={callbackUrl} />
      </div>

      <p className="mt-5 text-center text-sm">
        <Link href="/" className="font-semibold text-brand-700 hover:underline">
          {t("back")}
        </Link>
      </p>
      <p className="mt-8 text-center text-xs text-muted">
        {tc("safeguardingTitle")}
      </p>
    </div>
  );
}
