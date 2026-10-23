import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getAdmin } from "@/lib/admin";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { CompassMark } from "@/components/icons";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("admin.login");
  return { title: t("title"), robots: { index: false } };
}

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  const admin = await getAdmin();
  if (admin) redirect(`/${locale}/admin`);

  const t = await getTranslations("admin.login");
  const tc = await getTranslations("common");

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6 sm:py-20">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
          <CompassMark className="h-8 w-8" />
        </span>
        <h1 className="mt-4 text-2xl font-black text-brand-950">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </div>

      <div className="mt-6 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
        <AdminLoginForm locale={locale} />
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
