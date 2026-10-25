import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAdmin } from "@/lib/admin";
import { LocaleControls } from "@/components/locale-controls";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function AdminAccessDeniedPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  const admin = await getAdmin();
  if (!admin) return null;
  const [t, nav] = await Promise.all([getTranslations("admin.dashboard"), getTranslations("admin.nav")]);
  return <main className="mx-auto max-w-2xl px-4 py-10"><div className="flex justify-end"><LocaleControls locale={locale} /></div><section className="mt-8 rounded-2xl border border-gold-200 bg-white p-6 shadow-sm"><h1 className="text-xl font-black text-brand-950">{t("forbidden")}</h1><Link href="/" className="mt-4 inline-block text-sm font-semibold text-brand-700 underline">{nav("site")}</Link></section></main>;
}
