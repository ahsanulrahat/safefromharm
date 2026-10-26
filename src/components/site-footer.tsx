import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SafeguardingBox } from "@/components/safeguarding-box";
import { CompassMark } from "@/components/icons";

export async function SiteFooter() {
  const t = await getTranslations("common");

  return (
    <footer className="mt-16 border-t border-brand-100 bg-white dark:border-brand-900/80 dark:bg-brand-950/60 transition-colors duration-200">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <SafeguardingBox />
        <div className="mt-8 grid gap-6 text-sm text-muted dark:text-brand-300 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5 font-bold text-brand-950 dark:text-brand-50">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-xs">
                <CompassMark className="h-4 w-4" />
              </span>
              {t("brand")}
            </div>
            <p className="mt-3 leading-relaxed">{t("footerNote")}</p>
          </div>
          <div>
            <p className="font-semibold text-brand-950 dark:text-brand-100">{t("course")}</p>
            <ul className="mt-2 space-y-2">
              <li>
                <Link className="transition-colors duration-200 hover:text-brand-800 dark:hover:text-white hover:underline" href="/resume">
                  {t("resume")}
                </Link>
              </li>
              <li>
                <Link className="transition-colors duration-200 hover:text-brand-800 dark:hover:text-white hover:underline" href="/verify">
                  {t("verify")}
                </Link>
              </li>
              <li>
                <Link className="transition-colors duration-200 hover:text-brand-800 dark:hover:text-white hover:underline" href="/register">
                  {t("privacy")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-brand-950 dark:text-brand-100">{t("privacy")}</p>
            <p className="mt-2 leading-relaxed">{t("sampleNotice")}</p>
          </div>
        </div>
        <div className="mt-8 flex items-center gap-3 border-t border-brand-100 dark:border-brand-900 pt-5">
          <div className="h-px flex-1 bg-gradient-to-r from-brand-200/0 via-brand-200 to-brand-200/0 dark:via-brand-800" />
          <p className="shrink-0 text-xs text-muted dark:text-brand-400">
            © {new Date().getFullYear()} {t("copyright")}
          </p>
          <div className="h-px flex-1 bg-gradient-to-r from-brand-200/0 via-brand-200 to-brand-200/0 dark:via-brand-800" />
        </div>
      </div>
    </footer>
  );
}
