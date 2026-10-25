import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getOptionalParticipant } from "@/lib/participant";
import { getPublicStats } from "@/lib/public-stats";
import { CheckIcon, ShieldIcon, CompassMark } from "@/components/icons";
import { buttonClass, cardClass } from "@/components/ui";

export default async function HomePage() {
  const t = await getTranslations("home");
  const tc = await getTranslations("common");
  const participant = await getOptionalParticipant();
  const stats = await getPublicStats();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden scout-pattern">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-100 blur-3xl animate-float sm:h-96 sm:w-96"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-gold-100 blur-3xl animate-float stagger-3"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-accent-50/30 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 sm:pb-20 sm:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="animate-fade-in-up">
              <p className="inline-flex items-center gap-2 rounded-full border border-brand-200/80 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-brand-800 shadow-sm backdrop-blur sm:text-sm">
                <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse-soft" aria-hidden="true" />
                {t("badge")}
              </p>
              <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight text-brand-950 sm:text-6xl">
                {t("title")}
              </h1>
              <p className="mt-4 max-w-xl text-lg font-semibold text-brand-800 sm:text-xl">
                {t("subtitle")}
              </p>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-muted">
                {t("intro")}
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href={participant ? "/course" : "/register"}
                  className={buttonClass("primary", "lg") + " w-full sm:w-auto group"}
                >
                  {participant ? t("continue") : t("start")}
                  <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                </Link>
                <Link
                  href="/resume"
                  className={buttonClass("secondary") + " w-full sm:w-auto"}
                >
                  {t("resume")}
                </Link>
              </div>

              <p className="mt-4 flex items-center gap-2 text-sm text-muted">
                <ShieldIcon className="h-5 w-5 text-brand-600" />
                {tc("safeguardingTitle")}
              </p>
            </div>

            <div className="relative animate-fade-in-up stagger-2">
              <div className={cardClass + " relative overflow-hidden border-brand-200 !shadow-lg"}>
                {/* Accent stripe at top */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-accent-500 to-gold-400" />
                <div className="flex items-center gap-3 pt-2">
                  <span className="rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 p-2.5 text-brand-700">
                    <CompassMark className="h-8 w-8" />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gold-700">
                      Scout Moot 2026
                    </p>
                    <p className="text-lg font-bold text-brand-950">{tc("course")}</p>
                  </div>
                </div>

                <ul className="mt-5 space-y-3">
                  {[t("learn1Title"), t("learn2Title"), t("learn3Title")].map(
                    (item, index) => (
                      <li key={item} className="flex items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 text-xs font-bold text-white shadow-sm">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-brand-900">{item}</span>
                      </li>
                    )
                  )}
                </ul>

                <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-brand-100 pt-5 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {t("timeLabel")}
                    </dt>
                    <dd className="mt-0.5 font-semibold text-brand-900">{t("timeValue")}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {t("certLabel")}
                    </dt>
                    <dd className="mt-0.5 font-semibold text-brand-900">{t("certValue")}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {t("langLabel")}
                    </dt>
                    <dd className="mt-0.5 font-semibold text-brand-900">{t("langValue")}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                      {tc("privacy")}
                    </dt>
                    <dd className="mt-0.5 font-semibold text-brand-900">✓</dd>
                  </div>
                </dl>
              </div>
              <p className="mt-3 rounded-xl bg-gold-100/80 px-3 py-2 text-center text-xs font-semibold text-gold-800 backdrop-blur">
                {tc("sampleBadge")} · {tc("sampleNotice")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Stats Banner */}
      {stats.totalParticipants > 0 && (
        <section className="border-y border-brand-100 bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="animate-fade-in-up stagger-1">
                <p className="text-2xl font-black tabular-nums text-white sm:text-4xl">
                  {stats.totalParticipants.toLocaleString()}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-brand-200 sm:text-sm">
                  {t("statParticipants")}
                </p>
              </div>
              <div className="animate-fade-in-up stagger-2">
                <p className="text-2xl font-black tabular-nums text-white sm:text-4xl">
                  {stats.totalCertificates.toLocaleString()}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-brand-200 sm:text-sm">
                  {t("statCertificates")}
                </p>
              </div>
              <div className="animate-fade-in-up stagger-3">
                <p className="text-2xl font-black tabular-nums text-white sm:text-4xl">
                  {stats.totalModules.toLocaleString()}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-brand-200 sm:text-sm">
                  {t("statModules")}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Learn */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <h2 className="text-2xl font-bold tracking-tight text-brand-950 sm:text-3xl">
          {t("whatTitle")}
        </h2>
        <p className="mt-2 max-w-2xl text-muted">{t("whatIntro")}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { title: t("learn1Title"), body: t("learn1Body") },
            { title: t("learn2Title"), body: t("learn2Body") },
            { title: t("learn3Title"), body: t("learn3Body") },
          ].map((item, index) => (
            <div key={item.title} className={cardClass + ` animate-fade-in-up stagger-${index + 1}`}>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700">
                <ShieldIcon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-lg font-bold text-brand-900">
                {index + 1}. {item.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-brand-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <h2 className="text-2xl font-bold tracking-tight text-brand-950 sm:text-3xl">
            {t("howTitle")}
          </h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { title: t("how1Title"), body: t("how1Body") },
              { title: t("how2Title"), body: t("how2Body") },
              { title: t("how3Title"), body: t("how3Body") },
            ].map((step, index) => (
              <li key={step.title} className={`relative pl-12 animate-fade-in-up stagger-${index + 1}`}>
                <span className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 font-bold text-white shadow-sm">
                  {index + 1}
                </span>
                <h3 className="text-lg font-bold text-brand-900">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
                {index < 2 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[18px] top-9 hidden h-[calc(100%+1.5rem)] w-px bg-gradient-to-b from-brand-200 to-brand-100 md:block"
                  />
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Sample + privacy */}
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:px-6 sm:py-16 md:grid-cols-2">
        <div className="rounded-2xl border border-gold-200 bg-gradient-to-br from-gold-50 to-gold-100/50 p-6 hover-lift">
          <p className="text-xs font-bold uppercase tracking-wider text-gold-700">
            {tc("sampleBadge")}
          </p>
          <h2 className="mt-2 text-xl font-bold text-brand-950">{t("sampleTitle")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-gold-900">{t("sampleBody")}</p>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-white p-6 hover-lift">
          <h2 className="text-xl font-bold text-brand-950">{t("privacyTitle")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{t("privacyBody")}</p>
          <ul className="mt-4 space-y-2 text-sm text-brand-900">
            {[tc("safeguardingTitle"), tc("privacy")].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 px-6 py-10 text-center text-white shadow-lg sm:px-10 sm:py-12">
          {/* Decorative elements */}
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand-700/20 blur-2xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-accent-500/10 blur-2xl" />
          <div aria-hidden="true" className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-px w-1/2 bg-gradient-to-r from-transparent via-gold-400/50 to-transparent" />
          <div className="relative">
            <h2 className="text-2xl font-bold sm:text-3xl">{t("ctaTitle")}</h2>
            <p className="mx-auto mt-2 max-w-xl text-brand-100">{t("ctaBody")}</p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={participant ? "/course" : "/register"}
                className={buttonClass("gold") + " w-full sm:w-auto"}
              >
                {participant ? t("continue") : t("start")}
              </Link>
              <Link
                href="/verify"
                className="w-full rounded-xl border border-brand-400 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-brand-800 sm:w-auto"
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
