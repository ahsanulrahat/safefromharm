"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonClass } from "@/components/ui";

export default function LocaleError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useTranslations("common");

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-danger">
        {t("errorCode")}
      </p>
      <h1 className="mt-3 text-3xl font-bold text-ink">{t("errorTitle")}</h1>
      <p className="mt-3 text-muted">{t("errorDescription")}</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button className={buttonClass("primary")} onClick={() => retry()}>
          {t("tryAgain")}
        </button>
        <Link href="/" className={buttonClass("secondary")}>
          {t("backHome")}
        </Link>
      </div>
    </main>
  );
}
