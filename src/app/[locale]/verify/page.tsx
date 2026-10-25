import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { VerifyForm } from "@/components/verify-form";
import { ShieldIcon } from "@/components/icons";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata() {
  const t = await getTranslations("verify");
  return { title: t("title") };
}

export default async function VerifyIndexPage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("verify");

  return (
    <div className="relative mx-auto max-w-xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Decorative ambient background accents */}
      <div className="pointer-events-none absolute -top-10 right-0 -z-10 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl dark:bg-brand-500/5" />

      <div className="rounded-3xl border border-brand-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm sm:p-8 dark:border-brand-900/80 dark:bg-brand-950/60">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-700 to-brand-500 text-white shadow-md shadow-brand-700/20">
          <ShieldIcon className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-brand-950 sm:text-4xl dark:text-brand-50">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-muted dark:text-brand-300">{t("subtitle")}</p>

        <div className="mt-6">
          <VerifyForm
            label={t("formLabel")}
            placeholder={t("placeholder")}
            submit={t("submit")}
          />
        </div>

        <p className="mt-6 rounded-xl border border-brand-100/70 bg-brand-50/40 p-3.5 text-xs leading-relaxed text-muted dark:border-brand-900/60 dark:bg-brand-900/40 dark:text-brand-300">
          {t("privacy")}
        </p>

        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-900 hover:underline dark:text-brand-300 dark:hover:text-white"
          >
            <span aria-hidden="true">←</span> {t("backHome")}
          </Link>
        </div>
      </div>

      <input type="hidden" value={locale} readOnly />
    </div>
  );
}
