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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gold-700">
            {tc("brand")}
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-brand-950">
            {t("title")}
          </h1>
          <p className="mt-1 text-muted">
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

      <p className="mt-2 max-w-2xl text-sm text-muted">{t("subtitle")}</p>

      {state.activeCertificate && (
        <div className="mt-6 rounded-2xl border border-brand-300 bg-brand-50 p-5">
          <div className="flex items-start gap-3">
            <span className="rounded-full bg-white p-2 text-brand-700">
              <CheckIcon className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold text-brand-950">{t("certReadyTitle")}</h2>
              <p className="mt-0.5 text-sm text-brand-800">{t("certReadyBody")}</p>
              <Link
                href="/certificate"
                className={buttonClass("primary") + " mt-3"}
              >
                {t("viewCertificate")}
              </Link>
            </div>
          </div>
        </div>
      )}

      <section className="mt-7 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-brand-900">{t("progressLabel")}</span>
          <span className="font-bold text-brand-700">
            {completed} / {total} · {percent}%
          </span>
        </div>
        <div
          className="mt-2 h-2.5 overflow-hidden rounded-full bg-brand-100"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label={t("progressLabel")}
        >
          <div
            className="h-full rounded-full bg-brand-600 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </section>

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
                "rounded-2xl border p-5 shadow-sm transition " +
                (isComplete
                  ? "border-brand-300 bg-brand-50/60"
                  : unlocked
                    ? "border-brand-100 bg-white"
                    : "border-brand-100 bg-white/60")
              }
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">
                    {t("moduleLabel", { number: index + 1 })}
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-brand-950">{title}</h2>
                  <p className="mt-1 max-w-xl text-sm text-muted">{description}</p>
                </div>
                <span
                  className={
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold " +
                    (isComplete
                      ? "bg-brand-700 text-white"
                      : unlocked
                        ? "bg-gold-100 text-gold-800"
                        : "bg-brand-50 text-brand-700")
                  }
                >
                  {isComplete ? (
                    <span className="inline-flex items-center gap-1">
                      <CheckIcon className="h-3.5 w-3.5" /> {t("completed")}
                    </span>
                  ) : unlocked ? (
                    t("inProgress")
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <LockIcon className="h-3.5 w-3.5" /> {t("locked")}
                    </span>
                  )}
                </span>
              </div>

              {unlocked ? (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link
                    href={`/course/${module.slug}`}
                    className={buttonClass(isComplete ? "secondary" : "primary")}
                  >
                    {isComplete ? t("review") : t("continue")}
                  </Link>
                  {evaluation && !isComplete && (
                    <p className="text-xs text-muted">
                      {tm("mcqProgress", {
                        correct: evaluation.mcqCorrect,
                        total: evaluation.mcqTotal,
                        pass: evaluation.passMark,
                      })}
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted">{t("locked")}</p>
              )}
            </article>
          );
        })}
      </div>

      <p className="mt-6 rounded-xl border border-gold-200 bg-gold-50 px-4 py-3 text-xs text-gold-900">
        {t("sampleNote")}
      </p>
    </div>
  );
}
