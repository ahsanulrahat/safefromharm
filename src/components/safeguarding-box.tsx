import { getTranslations } from "next-intl/server";
import { ShieldIcon } from "@/components/icons";

/**
 * Safeguarding contact box. Shown on every page via the locale layout and the
 * verify page. Contact comes from SAFEGUARDING_CONTACT, never hard-coded.
 */
export async function SafeguardingBox({ compact = false }: { compact?: boolean }) {
  const t = await getTranslations("common");
  const contact = process.env.SAFEGUARDING_CONTACT?.trim();

  return (
    <aside
      aria-labelledby="safeguarding-heading"
      className="rounded-2xl border border-gold-200 bg-gold-50 p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 rounded-full bg-white p-2 text-gold-700">
          <ShieldIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2
            id="safeguarding-heading"
            className="text-sm font-bold text-brand-900 sm:text-base"
          >
            {t("safeguardingTitle")}
          </h2>
          {!compact && (
            <p className="mt-1 text-sm text-muted">{t("safeguardingIntro")}</p>
          )}
          <p className="mt-2 break-words text-sm font-medium text-brand-900">
            {contact ? (
              <>
                <span className="text-muted">{t("safeguardingContact")}: </span>
                {contact}
              </>
            ) : (
              <span className="text-muted">{t("safeguardingMissing")}</span>
            )}
          </p>
        </div>
      </div>
    </aside>
  );
}
