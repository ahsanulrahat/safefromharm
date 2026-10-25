import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { requireParticipant } from "@/lib/participant";
import { getCourseState } from "@/lib/course";
import { decryptText } from "@/lib/crypto";
import { ModuleVideo } from "@/components/module-video";
import { McqForm } from "@/components/mcq-form";
import { ReflectionForm } from "@/components/reflection-form";
import { CheckIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui";
import type { AppLocale } from "@/i18n/routing";
import { localizedText } from "@/i18n/localized";

export const dynamic = "force-dynamic";

type Option = { id: string; bn: string; en: string };

function parseOptions(value: unknown): Option[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (
      item &&
      typeof item === "object" &&
      "id" in item &&
      "bn" in item &&
      "en" in item &&
      typeof item.id === "string" &&
      typeof item.bn === "string" &&
      typeof item.en === "string"
    ) {
      return [{ id: item.id, bn: item.bn, en: item.en }];
    }
    return [];
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale; moduleSlug: string }>;
}) {
  const { moduleSlug } = await params;
  return { title: moduleSlug, robots: { index: false } };
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ locale: AppLocale; moduleSlug: string }>;
}) {
  const { locale, moduleSlug } = await params;
  const participant = await requireParticipant(locale);
  const state = await getCourseState(participant.id);
  const t = await getTranslations("module");
  const tc = await getTranslations("common");

  const moduleIndex = state.modules.findIndex((m) => m.slug === moduleSlug);
  if (moduleIndex === -1) notFound();
  const currentModule = state.modules[moduleIndex];
  const evaluation = state.evaluations.find((e) => e.moduleId === currentModule.id);
  const unlocked = Boolean(state.unlocked[currentModule.id]);
  const title = localizedText(locale, currentModule.titleBn, currentModule.titleEn);
  const description = localizedText(locale, currentModule.descriptionBn, currentModule.descriptionEn);
  const watched = state.watchedModuleIds.has(currentModule.id);

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-200 bg-white shadow-sm dark:border-brand-800 dark:bg-brand-950/60">
          <span className="text-2xl">🔒</span>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-brand-950 dark:text-brand-50">{t("lockedTitle")}</h1>
        <p className="mt-2 text-muted dark:text-brand-300">{t("lockedBody")}</p>
        <Link href="/course" className={buttonClass("primary") + " mt-6"}>
          {t("goCourse")}
        </Link>
      </div>
    );
  }

  const mcqSteps = currentModule.steps.filter((s) => s.type === "MCQ");
  const reflectionSteps = currentModule.steps.filter((s) => s.type === "REFLECTION");
  const nextModule = state.modules[moduleIndex + 1];
  const isComplete = Boolean(evaluation?.complete);

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute -top-10 right-0 -z-10 h-64 w-64 rounded-full bg-brand-500/5 blur-3xl dark:bg-brand-500/5" />

      <Link
        href="/course"
        className="group inline-flex items-center gap-2 rounded-xl border border-brand-200/80 bg-white/80 px-3.5 py-1.5 text-sm font-semibold text-brand-700 shadow-2xs backdrop-blur-sm transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-900 dark:border-brand-800 dark:bg-brand-900/50 dark:text-brand-300 dark:hover:bg-brand-900/80 dark:hover:text-white"
      >
        <span aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5">←</span>
        {t("back")}
      </Link>

      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted dark:text-brand-400">
          {locale === "bn" ? `${tc("brand")} · মডিউল ${moduleIndex + 1}` : `${tc("brand")} · Module ${moduleIndex + 1}`}
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-brand-950 dark:text-brand-50 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted dark:text-brand-300">{description}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
        <span
          className={
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 transition " +
            (watched
              ? "border-brand-200 bg-brand-50 text-brand-800 dark:border-brand-800 dark:bg-brand-900/60 dark:text-brand-200"
              : "border-brand-100 bg-white/70 text-muted dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-400")
          }
        >
          {t("videoProgress")} {watched ? "✓" : ""}
        </span>
        {evaluation && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50/70 px-3 py-1 text-brand-800 dark:border-brand-800 dark:bg-brand-900/60 dark:text-brand-200">
            {t("mcqProgress", {
              correct: evaluation.mcqCorrect,
              total: evaluation.mcqTotal,
              pass: evaluation.passMark,
            })}
          </span>
        )}
        {evaluation && evaluation.reflectionsTotal > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50/70 px-3 py-1 text-brand-800 dark:border-brand-800 dark:bg-brand-900/60 dark:text-brand-200">
            {t("reflectionsProgress", {
              done: evaluation.reflectionsDone,
              total: evaluation.reflectionsTotal,
            })}
          </span>
        )}
      </div>

      <section className="mt-8 rounded-2xl border border-brand-100 bg-white/80 p-5 shadow-xs backdrop-blur-sm sm:p-6 dark:border-brand-900/80 dark:bg-brand-950/60">
        <h2 className="text-lg font-bold text-brand-950 dark:text-brand-50">{t("videoTitle")}</h2>
        <p className="mt-1 mb-4 text-xs font-medium text-muted dark:text-brand-300">{t("videoHint")}</p>
        <ModuleVideo
          videoId={currentModule.videoId}
          moduleSlug={currentModule.slug}
          watched={watched}
          labels={{
            play: t("play"),
            fallback: t("fallback"),
            markWatched: t("markWatched"),
            marking: t("marking"),
            watchedNote: t("watchedNote"),
            error: t("videoError"),
          }}
        />
      </section>

      {mcqSteps.length > 0 && (
        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-xl font-black text-brand-950 dark:text-brand-50">{t("mcqTitle")}</h2>
          </div>
          <div className="space-y-6">
            {mcqSteps.map((step, index) => {
              const options = parseOptions(step.options);
              const progress = state.progressByStep.get(step.id);
              return (
                <div key={step.id}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-800 dark:bg-brand-800 dark:text-brand-100">
                      {index + 1}
                    </span>
                    <p className="text-xs font-bold uppercase tracking-wide text-muted dark:text-brand-400">
                      {t("questionOf", { current: index + 1, total: mcqSteps.length })}
                    </p>
                  </div>
                  <McqForm
                    moduleSlug={currentModule.slug}
                    stepId={step.id}
                    prompt={localizedText(locale, step.promptBn, step.promptEn)}
                    options={options.map((option) => ({
                      id: option.id,
                      label: localizedText(locale, option.bn, option.en),
                    }))}
                    existingOptionId={progress?.answerOptionId ?? undefined}
                    labels={{
                      submit: t("submit"),
                      submitting: t("submitting"),
                      correct: t("correct"),
                      incorrect: t("incorrect"),
                      answeredNote: t("answeredNote"),
                    }}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {reflectionSteps.length > 0 && (
        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-xl font-black text-brand-950 dark:text-brand-50">{t("reflectionTitle")}</h2>
          </div>
          <div className="space-y-6">
            {reflectionSteps.map((step) => {
              const progress = state.progressByStep.get(step.id);
              let defaultAnswer = "";
              if (progress?.reflectionCipher) {
                try {
                  defaultAnswer = decryptText(progress.reflectionCipher);
                } catch {
                  defaultAnswer = "";
                }
              }
              return (
                <ReflectionForm
                  key={step.id}
                  moduleSlug={currentModule.slug}
                  stepId={step.id}
                  prompt={localizedText(locale, step.promptBn, step.promptEn)}
                  minWords={step.minWords}
                  defaultAnswer={defaultAnswer}
                  labels={{
                    submit: t("submitReflection"),
                    submitting: t("submitting"),
                    words: t("words", { count: "{count}" }),
                    minWords: t("minWords", { min: "{min}" }),
                    savedNote: t("savedNote"),
                    hint: t("reflectionHint", { min: "{min}" }),
                    ready: t("ready"),
                  }}
                />
              );
            })}
          </div>
        </section>
      )}

      {isComplete ? (
        <section className="mt-10 overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-brand-50/60 p-6 shadow-xs sm:p-7 dark:border-brand-800 dark:from-brand-950 dark:via-brand-900/60 dark:to-brand-950">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-xs">
              <CheckIcon className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-brand-950 dark:text-brand-50">{t("completeTitle")}</h2>
              <p className="mt-1 text-sm text-brand-800 dark:text-brand-300">{t("completeBody")}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                {nextModule ? (
                  <Link
                    href={`/course/${nextModule.slug}`}
                    className={buttonClass("primary")}
                  >
                    {t("nextModule")} <span aria-hidden="true">→</span>
                  </Link>
                ) : state.activeCertificate ? (
                  <Link href="/certificate" className={buttonClass("gold")}>
                    {t("finishCourse")}
                  </Link>
                ) : (
                  <Link href="/course" className={buttonClass("primary")}>
                    {t("goCourse")}
                  </Link>
                )}
                <Link href="/course" className={buttonClass("secondary")}>
                  {t("goCourse")}
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="mt-8 rounded-xl border border-brand-100 bg-white/90 p-4 text-xs font-medium text-muted shadow-2xs dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-300">
          {t("retryNote")}
        </div>
      )}
    </div>
  );
}
