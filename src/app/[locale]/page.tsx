import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getOptionalParticipant } from "@/lib/participant";
import { getPublicStats } from "@/lib/public-stats";
import { CheckIcon, ShieldIcon, CompassMark } from "@/components/icons";
import { buttonClass, cardClass } from "@/components/ui";
import { FaqAccordion } from "@/components/faq-accordion";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const participant = await getOptionalParticipant();
  const t = await getTranslations("home");
  const tc = await getTranslations("common");
  const stats = await getPublicStats();

  const faqItems = [
    { question: t("faq1Q"), answer: t("faq1A") },
    { question: t("faq2Q"), answer: t("faq2A") },
    { question: t("faq3Q"), answer: t("faq3A") },
    { question: t("faq4Q"), answer: t("faq4A") },
    { question: t("faq5Q"), answer: t("faq5A") },
    { question: t("faq6Q"), answer: t("faq6A") },
  ];

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12 sm:pt-16 sm:pb-20 scout-pattern">
        {/* Decorative ambient blurred spots */}
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl dark:bg-brand-500/5" />
        <div aria-hidden="true" className="pointer-events-none absolute top-1/2 -left-24 h-96 w-96 rounded-full bg-scout-red/5 blur-3xl" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-gold-200 bg-gold-50/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-gold-800 shadow-2xs backdrop-blur-sm dark:border-gold-800/60 dark:bg-gold-950/40 dark:text-gold-300">
                <span className="h-1.5 w-1.5 rounded-full bg-scout-red animate-pulse" />
                {t("badge")}
              </span>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-brand-950 sm:text-5xl lg:text-6xl dark:text-brand-50">
                <span className="text-gradient block">{t("title")}</span>
              </h1>

              <p className="mt-2 text-xl font-bold text-brand-800 dark:text-brand-300">
                {t("subtitle")}
              </p>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted dark:text-brand-200">
                {t("intro")}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href={participant ? "/course" : "/register"}
                  className={buttonClass("primary", "lg") + " shadow-sm"}
                >
                  {participant ? t("continue") : t("start")}
                  <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href="/resume"
                  className={buttonClass("secondary", "lg")}
                >
                  {t("resume")}
                </Link>
              </div>

              <p className="mt-5 flex items-center gap-2 text-xs font-medium text-muted dark:text-brand-300">
                <ShieldIcon className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                {tc("safeguardingTitle")}
              </p>
            </div>

            <div className="relative animate-fade-in-up stagger-2">
              <div className={cardClass + " relative overflow-hidden border-brand-200 dark:border-brand-800/80 !shadow-lg"}>
                {/* Accent stripe at top */}
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand-600 via-accent-500 to-gold-400" />
                <div className="flex items-center gap-3 pt-2">
                  <span className="rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 p-2.5 text-brand-700 dark:from-brand-900/60 dark:to-brand-800/60 dark:text-brand-300">
                    <CompassMark className="h-8 w-8" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gold-700 dark:text-gold-400">
                      Scout Moot 2026
                    </p>
                    <p className="text-lg font-bold text-brand-950 dark:text-brand-50">{tc("course")}</p>
                  </div>
                </div>

                <ul className="mt-5 space-y-3">
                  {[t("learn1Title"), t("learn2Title"), t("learn3Title")].map(
                    (item, index) => (
                      <li key={item} className="flex items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 text-xs font-bold text-white shadow-xs">
                          {index + 1}
                        </span>
                        <span className="text-sm font-semibold text-brand-950 dark:text-brand-100">{item}</span>
                      </li>
                    )
                  )}
                </ul>

                <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-brand-100 dark:border-brand-900/80 pt-5 text-sm">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-muted dark:text-brand-400">
                      {t("timeLabel")}
                    </dt>
                    <dd className="mt-0.5 font-bold text-brand-950 dark:text-brand-100">{t("timeValue")}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-muted dark:text-brand-400">
                      {t("certLabel")}
                    </dt>
                    <dd className="mt-0.5 font-bold text-brand-950 dark:text-brand-100">{t("certValue")}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-muted dark:text-brand-400">
                      {t("langLabel")}
                    </dt>
                    <dd className="mt-0.5 font-bold text-brand-950 dark:text-brand-100">{t("langValue")}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-muted dark:text-brand-400">
                      {tc("privacy")}
                    </dt>
                    <dd className="mt-0.5 font-bold text-brand-700 dark:text-brand-300">✓ Protected</dd>
                  </div>
                </dl>
              </div>

              <p className="mt-3 rounded-xl border border-gold-200/80 bg-gold-50/80 px-3.5 py-2 text-center text-xs font-semibold text-gold-900 backdrop-blur-sm dark:border-gold-900/60 dark:bg-gold-950/40 dark:text-gold-200">
                {tc("sampleBadge")} · {tc("sampleNotice")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Participation Statistics */}
      {stats.totalParticipants > 0 && (
        <section className="border-y border-brand-100 bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 shadow-inner dark:border-brand-900">
          <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-9">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="animate-fade-in-up stagger-1">
                <p className="text-3xl font-black tabular-nums text-white sm:text-5xl">
                  {stats.totalParticipants.toLocaleString()}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-brand-200 sm:text-sm">
                  {t("statParticipants")}
                </p>
              </div>
              <div className="animate-fade-in-up stagger-2">
                <p className="text-3xl font-black tabular-nums text-white sm:text-5xl">
                  {stats.totalCertificates.toLocaleString()}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-brand-200 sm:text-sm">
                  {t("statCertificates")}
                </p>
              </div>
              <div className="animate-fade-in-up stagger-3">
                <p className="text-3xl font-black tabular-nums text-white sm:text-5xl">
                  {stats.totalModules.toLocaleString()}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-brand-200 sm:text-sm">
                  {t("statModules")}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* About Section: What you will learn */}
      <section id="about" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 scroll-mt-20">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-gold-700 dark:text-gold-400">
            {t("badge")}
          </span>
          <h2 className="mt-1 text-3xl font-black tracking-tight text-brand-950 sm:text-4xl dark:text-brand-50">
            {t("whatTitle")}
          </h2>
          <p className="mt-2 text-base text-muted dark:text-brand-200">{t("whatIntro")}</p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {[
            { title: t("learn1Title"), body: t("learn1Body"), num: "01" },
            { title: t("learn2Title"), body: t("learn2Body"), num: "02" },
            { title: t("learn3Title"), body: t("learn3Body"), num: "03" },
          ].map((item, index) => (
            <div key={item.title} className={cardClass + ` animate-fade-in-up stagger-${index + 1} flex flex-col justify-between`}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 shadow-2xs dark:bg-brand-900/60 dark:text-brand-300">
                    <ShieldIcon className="h-6 w-6" />
                  </span>
                  <span className="font-mono text-xs font-bold text-muted dark:text-brand-400">
                    {item.num}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-brand-950 dark:text-brand-50">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted dark:text-brand-300">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modules Section */}
      <section id="modules" className="border-y border-brand-100 bg-white/70 py-12 sm:py-16 dark:border-brand-900/80 dark:bg-brand-950/40 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gold-700 dark:text-gold-400">
                {tc("course")}
              </span>
              <h2 className="mt-1 text-3xl font-black tracking-tight text-brand-950 sm:text-4xl dark:text-brand-50">
                {t("modulesTitle")}
              </h2>
              <p className="mt-2 max-w-xl text-base text-muted dark:text-brand-200">
                {t("modulesIntro")}
              </p>
            </div>
            <Link
              href={participant ? "/course" : "/register"}
              className={buttonClass("primary") + " self-start sm:self-auto"}
            >
              {participant ? t("continue") : t("start")} →
            </Link>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {[
              {
                num: 1,
                title: t("learn1Title"),
                desc: t("learn1Body"),
              },
              {
                num: 2,
                title: t("learn2Title"),
                desc: t("learn2Body"),
              },
              {
                num: 3,
                title: t("learn3Title"),
                desc: t("learn3Body"),
              },
            ].map((m) => (
              <div
                key={m.num}
                className="group relative overflow-hidden rounded-2xl border border-brand-200/90 bg-white p-6 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-md dark:border-brand-900/80 dark:bg-brand-950/60"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-xs font-bold text-white shadow-xs">
                    {m.num}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted dark:text-brand-400">
                    Module {m.num}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-brand-950 dark:text-brand-50">
                  {m.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted dark:text-brand-300">
                  {m.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 scroll-mt-20">
        <h2 className="text-3xl font-black tracking-tight text-brand-950 sm:text-4xl dark:text-brand-50">
          {t("howTitle")}
        </h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            { title: t("how1Title"), body: t("how1Body") },
            { title: t("how2Title"), body: t("how2Body") },
            { title: t("how3Title"), body: t("how3Body") },
          ].map((step, index) => (
            <li key={step.title} className={`relative pl-13 animate-fade-in-up stagger-${index + 1}`}>
              <span className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-sm font-black text-white shadow-xs">
                {index + 1}
              </span>
              <h3 className="text-lg font-bold text-brand-950 dark:text-brand-50">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted dark:text-brand-300">{step.body}</p>
              {index < 2 && (
                <span
                  aria-hidden="true"
                  className="absolute left-[20px] top-10 hidden h-[calc(100%+1.5rem)] w-px bg-gradient-to-b from-brand-300 to-brand-100 md:block dark:from-brand-800 dark:to-brand-900"
                />
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* Frequently Asked Questions (FAQ) Section */}
      <section id="faq" className="border-t border-brand-100 bg-white/70 py-12 sm:py-16 dark:border-brand-900/80 dark:bg-brand-950/40 scroll-mt-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-gold-700 dark:text-gold-400">
              {t("badge")}
            </span>
            <h2 className="mt-1 text-3xl font-black tracking-tight text-brand-950 sm:text-4xl dark:text-brand-50">
              {t("faqTitle")}
            </h2>
            <p className="mt-2 text-base text-muted dark:text-brand-200">
              {t("faqSubtitle")}
            </p>
          </div>

          <div className="mt-8">
            <FaqAccordion items={faqItems} />
          </div>
        </div>
      </section>

      {/* Sample notice & Privacy summary */}
      <section className="mx-auto grid max-w-6xl gap-5 px-4 sm:px-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gold-200/90 bg-gradient-to-br from-gold-50/90 via-amber-50/40 to-gold-50/90 p-6 shadow-2xs dark:border-gold-900/60 dark:bg-gold-950/30">
          <p className="text-xs font-bold uppercase tracking-wider text-gold-800 dark:text-gold-400">
            {tc("sampleBadge")}
          </p>
          <h2 className="mt-2 text-xl font-bold text-brand-950 dark:text-brand-50">{t("sampleTitle")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-gold-950 dark:text-gold-200">{t("sampleBody")}</p>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-2xs dark:border-brand-900/80 dark:bg-brand-950/50">
          <h2 className="text-xl font-bold text-brand-950 dark:text-brand-50">{t("privacyTitle")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted dark:text-brand-300">{t("privacyBody")}</p>
          <ul className="mt-4 space-y-2 text-sm font-semibold text-brand-900 dark:text-brand-200">
            {[tc("safeguardingTitle"), tc("privacy")].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Call To Action Banner */}
      <section className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-950 via-brand-900 to-brand-950 px-6 py-10 text-center text-white shadow-xl sm:px-10 sm:py-14">
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-60 w-60 rounded-full bg-brand-600/20 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-12 -left-12 h-60 w-60 rounded-full bg-accent-500/10 blur-3xl" />
          <div className="relative">
            <h2 className="text-3xl font-black sm:text-4xl">{t("ctaTitle")}</h2>
            <p className="mx-auto mt-2 max-w-xl text-base text-brand-200">{t("ctaBody")}</p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={participant ? "/course" : "/register"}
                className={buttonClass("gold", "lg") + " w-full sm:w-auto shadow-md"}
              >
                {participant ? t("continue") : t("start")}
              </Link>
              <Link
                href="/verify"
                className="w-full rounded-xl border border-brand-400/80 bg-white/5 px-6 py-3.5 text-base font-semibold text-white transition-all duration-200 hover:bg-white/10 sm:w-auto"
              >
                {tc("verify")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
