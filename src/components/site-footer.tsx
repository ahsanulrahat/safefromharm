import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SafeguardingBox } from "@/components/safeguarding-box";
import { CompassMark } from "@/components/icons";

export async function SiteFooter() {
  const t = await getTranslations("common");

  return (
    <footer className="mt-16 border-t border-brand-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <SafeguardingBox />
        <div className="mt-8 grid gap-6 text-sm text-muted sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 font-bold text-brand-900">
              <CompassMark className="h-7 w-7 text-brand-700" />
              {t("brand")}
            </div>
            <p className="mt-2 leading-relaxed">{t("footerNote")}</p>
          </div>
          <div>
            <p className="font-semibold text-brand-900">{t("course")}</p>
            <ul className="mt-2 space-y-1.5">
              <li>
                <Link className="hover:text-brand-800 hover:underline" href="/register">
                  {t("resume")}
                </Link>
              </li>
              <li>
                <Link className="hover:text-brand-800 hover:underline" href="/verify">
                  {t("verify")}
                </Link>
              </li>
              <li>
                <Link className="hover:text-brand-800 hover:underline" href="/register">
                  {t("privacy")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-brand-900">{t("privacy")}</p>
            <p className="mt-2 leading-relaxed">{t("sampleNotice")}</p>
          </div>
        </div>
        <p className="mt-8 border-t border-brand-100 pt-5 text-xs text-muted">
          © {new Date().getFullYear()} {t("copyright")}
        </p>
      </div>
    </footer>
  );
}
