import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getOptionalParticipant } from "@/lib/participant";
import { CheckIcon, ShieldIcon, CompassMark } from "@/components/icons";
import { buttonClass, cardClass } from "@/components/ui";

export default async function HomePage() {
  const t = await getTranslations("home");
  const tc = await getTranslations("common");
  const participant = await getOptionalParticipant();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-100 blur-3xl sm:h-96 sm:w-96"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-gold-100 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 sm:pb-20 sm:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-800 sm:text-sm">
                <span className="h-2 w-2 rounded-full bg-brand-500" aria-hidden="true" />
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
                  className={buttonClass("primary") + " w-full sm:w-auto"}
                >
                  {participant ? t("continue") : t("start")}
                  <span aria-hidden="true">→</span>
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

            <div className="relative">
              <div className={cardClass + " relative overflow-hidden border-brand-200"}>
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-brand-50 p-2.5 text-brand-700">
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
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white">
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
              <p className="mt-3 rounded-lg bg-gold-100 px-3 py-2 text-center text-xs font-semibold text-gold-800">
                {tc("sampleBadge")} · {tc("sampleNotice")}
              </p>
            </div>
          </div>
        </div>
      </section>

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
            <div key={item.title} className={cardClass}>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
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
              <li key={step.title} className="relative pl-12">
                <span className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="text-lg font-bold text-brand-900">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
                {index < 2 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-9 top-9 hidden h-[calc(100%+1.5rem)] w-px bg-brand-100 md:block"
                  />
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Sample + privacy */}
      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-12 sm:px-6 sm:py-16 md:grid-cols-2">
        <div className="rounded-2xl border border-gold-200 bg-gold-50 p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-gold-700">
            {tc("sampleBadge")}
          </p>
          <h2 className="mt-2 text-xl font-bold text-brand-950">{t("sampleTitle")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-gold-900">{t("sampleBody")}</p>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-white p-6">
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
        <div className="rounded-3xl bg-brand-900 px-6 py-10 text-center text-white sm:px-10 sm:py-12">
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
              className="w-full rounded-lg border border-brand-400 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 sm:w-auto"
            >
              {tc("verify")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
