import { getTranslations } from "next-intl/server";
import { getPublicStats } from "@/lib/public-stats";

export function PublicStatsLoading({ label }: { label: string }) {
  return (
    <div
      className="grid grid-cols-3 gap-4 text-center"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {[0, 1, 2].map((item) => (
        <div key={item} className="animate-pulse">
          <span className="mx-auto block h-9 w-16 rounded bg-white/20 sm:h-12 sm:w-24" />
          <span className="mx-auto mt-2 block h-3 w-20 rounded bg-white/15 sm:w-28" />
        </div>
      ))}
    </div>
  );
}

export async function PublicStats() {
  const [stats, t] = await Promise.all([
    getPublicStats(),
    getTranslations("home"),
  ]);

  if (!stats.available) {
    return (
      <p className="rounded-lg bg-white/10 px-4 py-3 text-center text-sm text-white" role="alert">
        {t("statsUnavailable")}
      </p>
    );
  }

  const values = [
    [stats.totalParticipants, t("statParticipants")],
    [stats.totalCertificates, t("statCertificates")],
    [stats.totalModules, t("statModules")],
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-4 text-center">
      {values.map(([value, label]) => (
        <div key={label}>
          <p className="text-3xl font-black tabular-nums text-white sm:text-5xl">
            {value.toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wider text-brand-200 sm:text-sm">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}
