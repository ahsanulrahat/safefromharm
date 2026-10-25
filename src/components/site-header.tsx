import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { CompassMark } from "@/components/icons";
import type { AppLocale } from "@/i18n/routing";

export async function SiteHeader({ locale }: { locale: AppLocale }) {
  const t = await getTranslations("common");

  return (
    <header className="sticky top-0 z-30 border-b border-brand-100/60 glass">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-2.5 text-brand-900 transition-colors"
          aria-label={`${t("brand")} — ${t("course")}`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
            <CompassMark className="h-6 w-6" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-bold sm:text-base">
              {t("brand")}
            </span>
            <span className="block truncate text-xs text-muted">
              {t("course")}
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          <Link
            href="/verify"
            className="hidden rounded-xl px-3 py-1.5 text-xs font-semibold text-brand-800 transition-all duration-200 hover:bg-brand-50 hover:text-brand-900 sm:block sm:text-sm"
          >
            {t("verify")}
          </Link>
          <LanguageSwitcher locale={locale} />
          <Link
            href="/admin"
            className="rounded-xl border border-brand-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-brand-800 shadow-sm transition-all duration-200 hover:border-brand-300 hover:bg-brand-50 hover:shadow-md sm:px-3.5 sm:text-sm"
          >
            {t("admin")}
          </Link>
        </div>
      </div>
    </header>
  );
}
