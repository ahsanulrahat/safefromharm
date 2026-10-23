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
  const title = locale === "bn" ? currentModule.titleBn : currentModule.titleEn;
  const description =
    locale === "bn" ? currentModule.descriptionBn : currentModule.descriptionEn;
  const watched = state.watchedModuleIds.has(currentModule.id);

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-brand-950">{t("lockedTitle")}</h1>
        <p className="mt-2 text-muted">{t("lockedBody")}</p>
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
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/course"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
      >
        <span aria-hidden="true">←</span> {t("back")}
      </Link>

      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted">
        {locale === "bn" ? `${tc("brand")} · মডিউল ${moduleIndex + 1}` : `${tc("brand")} · Module ${moduleIndex + 1}`}
      </p>
      <h1 className="mt-1 text-2xl font-black tracking-tight text-brand-950 sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 text-sm text-muted">{description}</p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
        <span
          className={
            "rounded-full px-2.5 py-1 " +
            (watched ? "bg-brand-100 text-brand-800" : "bg-brand-50 text-muted")
          }
        >
          {t("videoProgress")} {watched ? "✓" : ""}
        </span>
        {evaluation && (
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-brand-800">
            {t("mcqProgress", {
              correct: evaluation.mcqCorrect,
              total: evaluation.mcqTotal,
              pass: evaluation.passMark,
            })}
          </span>
        )}
        {evaluation && evaluation.reflectionsTotal > 0 && (
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-brand-800">
            {t("reflectionsProgress", {
              done: evaluation.reflectionsDone,
              total: evaluation.reflectionsTotal,
            })}
          </span>
        )}
      </div>

      <section className="mt-7">
        <h2 className="mb-2 text-lg font-bold text-brand-950">{t("videoTitle")}</h2>
        <p className="mb-3 text-xs text-muted">{t("videoHint")}</p>
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
          <h2 className="text-lg font-bold text-brand-950">{t("mcqTitle")}</h2>
          <div className="mt-3 space-y-4">
            {mcqSteps.map((step, index) => {
              const options = parseOptions(step.options);
              const progress = state.progressByStep.get(step.id);
              return (
                <div key={step.id}>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
                    {t("questionOf", { current: index + 1, total: mcqSteps.length })}
                  </p>
                  <McqForm
                    moduleSlug={currentModule.slug}
                    stepId={step.id}
                    prompt={locale === "bn" ? step.promptBn : step.promptEn}
                    options={options.map((option) => ({
                      id: option.id,
                      label: locale === "bn" ? option.bn : option.en,
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
          <h2 className="text-lg font-bold text-brand-950">{t("reflectionTitle")}</h2>
          <div className="mt-3 space-y-4">
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
                  prompt={locale === "bn" ? step.promptBn : step.promptEn}
                  minWords={step.minWords}
                  defaultAnswer={defaultAnswer}
                  labels={{
                    submit: t("submitReflection"),
                    submitting: t("submitting"),
                    words: t("words"),
                    minWords: t("minWords"),
                    savedNote: t("savedNote"),
                    hint: t("reflectionHint"),
                  }}
                />
              );
            })}
          </div>
        </section>
      )}

      {isComplete ? (
        <section className="mt-10 rounded-2xl border border-brand-300 bg-brand-50 p-6">
          <div className="flex items-start gap-3">
            <span className="rounded-full bg-white p-2 text-brand-700">
              <CheckIcon className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-brand-950">{t("completeTitle")}</h2>
              <p className="mt-1 text-sm text-brand-800">{t("completeBody")}</p>
              <div className="mt-4 flex flex-wrap gap-3">
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
        <p className="mt-8 rounded-xl border border-brand-100 bg-white px-4 py-3 text-xs text-muted">
          {t("retryNote")}
        </p>
      )}
    </div>
  );
}
