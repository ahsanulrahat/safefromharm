import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireParticipant } from "@/lib/participant";
import { getCourseState } from "@/lib/course";
import { signOutParticipantAction } from "@/actions/resume";
import { CheckIcon, LockIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("course");
  return { title: t("title"), robots: { index: false } };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  const participant = await requireParticipant(locale);
  const state = await getCourseState(participant.id);
  const t = await getTranslations("course");
  const tm = await getTranslations("module");
  const tc = await getTranslations("common");

  const completed = state.evaluations.filter((e) => e.complete).length;
  const total = state.modules.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="relative mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Decorative backdrop glow */}
      <div className="pointer-events-none absolute -top-12 right-0 -z-10 h-72 w-72 rounded-full bg-brand-500/5 blur-3xl" />
      <div className="pointer-events-none absolute top-40 left-0 -z-10 h-72 w-72 rounded-full bg-scout-red/5 blur-3xl" />

      {/* Top Header Card */}
      <div className="rounded-2xl border border-brand-100 bg-white/80 p-6 shadow-xs backdrop-blur-md sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-200 bg-gold-50/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold-800">
              <span className="h-1.5 w-1.5 rounded-full bg-scout-red animate-pulse" />
              {tc("brand")}
            </span>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-brand-950 sm:text-4xl">
              {t("title")}
            </h1>
            <p className="mt-1.5 font-medium text-brand-800">
              {t("welcome", { name: participant.fullNameBn })}
            </p>
          </div>
          <form action={signOutParticipantAction}>
            <input type="hidden" name="locale" value={locale} />
            <button type="submit" className={buttonClass("ghost")}>
              {tc("logout")}
            </button>
          </form>
        </div>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          {t("subtitle")}
        </p>

        {/* Certificate banner if ready */}
        {state.activeCertificate && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 via-white to-brand-50/50 p-5 shadow-xs">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-xs">
                  <CheckIcon className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-brand-950 sm:text-lg">
                    {t("certReadyTitle")}
                  </h2>
                  <p className="mt-0.5 text-sm text-brand-800">
                    {t("certReadyBody")}
                  </p>
                </div>
              </div>
              <Link
                href="/certificate"
                className={buttonClass("primary") + " shrink-0 shadow-sm"}
              >
                {t("viewCertificate")}
              </Link>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <section className="mt-6 rounded-xl border border-brand-100/80 bg-brand-50/40 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-brand-950">
              {t("progressLabel")}
            </span>
            <span className="font-bold text-brand-700">
              {completed} / {total} · {percent}%
            </span>
          </div>
          <div
            className="mt-2.5 h-3 overflow-hidden rounded-full bg-brand-100 shadow-inner"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-label={t("progressLabel")}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-600 to-emerald-500 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </section>
      </div>

      {/* Modules List */}
      <div className="mt-6 space-y-4">
        {state.modules.map((module, index) => {
          const evaluation = state.evaluations.find((e) => e.moduleId === module.id);
          const isComplete = Boolean(evaluation?.complete);
          const unlocked = Boolean(state.unlocked[module.id]);
          const title = locale === "bn" ? module.titleBn : module.titleEn;
          const description =
            locale === "bn" ? module.descriptionBn : module.descriptionEn;

          return (
            <article
              key={module.id}
              className={
                "group relative overflow-hidden rounded-2xl border p-5 shadow-xs transition-all duration-200 sm:p-6 " +
                (isComplete
                  ? "border-brand-200/90 bg-white hover:border-brand-300 hover:shadow-md"
                  : unlocked
                    ? "border-brand-200 bg-white hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
                    : "border-brand-100/60 bg-white/60 opacity-80")
              }
            >
              {isComplete && (
                <div className="absolute top-0 left-0 h-full w-1.5 bg-brand-600" />
              )}
              {unlocked && !isComplete && (
                <div className="absolute top-0 left-0 h-full w-1.5 bg-gold-500" />
              )}

              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 pl-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-800">
                      {index + 1}
                    </span>
                    {t("moduleLabel", { number: index + 1 })}
                  </span>
                  <h2 className="mt-1 text-lg font-bold text-brand-950 sm:text-xl">
                    {title}
                  </h2>
                  <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
                    {description}
                  </p>
                </div>

                <span
                  className={
                    "shrink-0 rounded-full px-3 py-1 text-xs font-semibold shadow-xs " +
                    (isComplete
                      ? "bg-brand-700 text-white"
                      : unlocked
                        ? "bg-gold-100 text-gold-900 border border-gold-200"
                        : "bg-surface-cream text-muted border border-brand-100")
                  }
                >
                  {isComplete ? (
                    <span className="inline-flex items-center gap-1.5">
                      <CheckIcon className="h-3.5 w-3.5" /> {t("completed")}
                    </span>
                  ) : unlocked ? (
                    t("inProgress")
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <LockIcon className="h-3.5 w-3.5" /> {t("locked")}
                    </span>
                  )}
                </span>
              </div>

              {unlocked ? (
                <div className="mt-5 flex flex-wrap items-center gap-3 pl-2">
                  <Link
                    href={`/course/${module.slug}`}
                    className={buttonClass(isComplete ? "secondary" : "primary")}
                  >
                    {isComplete ? t("review") : t("continue")}
                  </Link>
                  {evaluation && !isComplete && (
                    <p className="text-xs font-medium text-muted">
                      {tm("mcqProgress", {
                        correct: evaluation.mcqCorrect,
                        total: evaluation.mcqTotal,
                        pass: evaluation.passMark,
                      })}
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-4 pl-2 text-sm text-muted">{t("locked")}</p>
              )}
            </article>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-gold-200 bg-gold-50/70 p-4 text-xs font-medium text-gold-950 shadow-xs">
        {t("sampleNote")}
      </div>
    </div>
  );
}
