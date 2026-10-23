import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { CompassMark } from "@/components/icons";
import type { AppLocale } from "@/i18n/routing";

export async function SiteHeader({ locale }: { locale: AppLocale }) {
  const t = await getTranslations("common");

  return (
    <header className="sticky top-0 z-30 border-b border-brand-100/90 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5 text-brand-900"
          aria-label={`${t("brand")} — ${t("course")}`}
        >
          <CompassMark className="h-9 w-9 shrink-0 text-brand-700" />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-bold sm:text-base">
              {t("brand")}
            </span>
            <span className="block truncate text-xs text-muted">
              {t("course")}
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href="/verify"
            className="hidden rounded-md px-2 py-1 text-xs font-semibold text-brand-800 hover:bg-brand-50 sm:block sm:text-sm"
          >
            {t("verify")}
          </Link>
          <LanguageSwitcher locale={locale} />
          <Link
            href="/admin"
            className="rounded-md border border-brand-200 bg-white px-2 py-1 text-xs font-semibold text-brand-800 hover:bg-brand-50 sm:px-3 sm:text-sm"
          >
            {t("admin")}
          </Link>
        </div>
      </div>
    </header>
  );
}
