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
      className="relative overflow-hidden rounded-2xl border border-gold-200/90 bg-gradient-to-br from-gold-50/90 via-amber-50/50 to-gold-50/90 p-4 shadow-xs backdrop-blur-sm sm:p-5"
    >
      <div className="flex items-start gap-3.5">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-gold-700 shadow-2xs">
          <ShieldIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2
            id="safeguarding-heading"
            className="text-sm font-bold text-brand-950 sm:text-base"
          >
            {t("safeguardingTitle")}
          </h2>
          {!compact && (
            <p className="mt-1 text-sm leading-relaxed text-brand-900/80">{t("safeguardingIntro")}</p>
          )}
          <p className="mt-2 break-words text-sm font-semibold text-brand-950">
            {contact ? (
              <>
                <span className="font-normal text-muted">{t("safeguardingContact")}: </span>
                <span className="font-mono text-xs sm:text-sm font-bold text-brand-900">{contact}</span>
              </>
            ) : (
              <span className="font-normal text-muted">{t("safeguardingMissing")}</span>
            )}
          </p>
        </div>
      </div>
    </aside>
  );
}
