import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ResumeForms } from "@/components/resume-forms";
import { SafeguardingBox } from "@/components/safeguarding-box";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata() {
  const t = await getTranslations("resume");
  return { title: t("title") };
}

export default async function ResumePage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("resume");

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Decorative ambient background accents */}
      <div className="pointer-events-none absolute -top-10 right-0 -z-10 h-72 w-72 rounded-full bg-brand-500/5 blur-3xl dark:bg-brand-500/5" />
      <div className="pointer-events-none absolute top-48 left-0 -z-10 h-72 w-72 rounded-full bg-scout-red/5 blur-3xl" />

      <Link
        href="/"
        className="group inline-flex items-center gap-2 rounded-xl border border-brand-200/80 bg-white/80 px-3.5 py-1.5 text-sm font-semibold text-brand-700 shadow-2xs backdrop-blur-sm transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-900 dark:border-brand-800 dark:bg-brand-900/50 dark:text-brand-300 dark:hover:bg-brand-900/80 dark:hover:text-white"
      >
        <span aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5">←</span>
        Home
      </Link>

      <div className="mt-5">
        <h1 className="text-3xl font-black tracking-tight text-brand-950 sm:text-4xl dark:text-brand-50">
          {t("title")}
        </h1>
        <p className="mt-2 max-w-xl text-base text-muted dark:text-brand-300">{t("subtitle")}</p>
      </div>

      <div className="mt-7">
        <ResumeForms locale={locale} />
      </div>

      <p className="mt-6 text-center text-sm font-medium text-muted dark:text-brand-400">
        {t("noAccount")}{" "}
        <Link href="/register" className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-900 dark:text-brand-300 dark:hover:text-white">
          {t("register")}
        </Link>
      </p>

      <div className="mt-8">
        <SafeguardingBox compact />
      </div>
    </div>
  );
}
