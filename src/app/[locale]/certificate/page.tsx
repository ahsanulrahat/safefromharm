import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireParticipant } from "@/lib/participant";
import { getCourseState, recalcParticipant } from "@/lib/course";
import { formatDate } from "@/lib/format";
import { CopyField } from "@/components/copy-field";
import { CheckIcon, CompassMark, ShieldIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("certificate");
  return { title: t("title"), robots: { index: false } };
}

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  const participant = await requireParticipant(locale);

  let state = await getCourseState(participant.id);
  if (!state.activeCertificate && state.courseComplete && !state.anyCertificate) {
    state = await recalcParticipant(participant.id);
  }

  const t = await getTranslations("certificate");
  const tc = await getTranslations("common");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const certificate = state.activeCertificate;

  if (!certificate) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-100 text-gold-700 shadow-sm dark:bg-gold-950 dark:text-gold-300">
          <ShieldIcon className="h-8 w-8" />
        </span>
        {state.anyCertificate ? (
          <>
            <h1 className="mt-5 text-2xl font-bold text-brand-950 dark:text-brand-50">
              {t("revokedTitle")}
            </h1>
            <p className="mt-2 text-muted dark:text-brand-300">{t("revokedBody")}</p>
          </>
        ) : (
          <>
            <h1 className="mt-5 text-2xl font-bold text-brand-950 dark:text-brand-50">
              {t("notReady")}
            </h1>
            <p className="mt-2 text-muted dark:text-brand-300">{t("body")}</p>
          </>
        )}
        <Link href="/course" className={buttonClass("primary") + " mt-6"}>
          {tc("back")}
        </Link>
      </div>
    );
  }

  const verifyUrl = `${siteUrl}/verify/${certificate.id}`;

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Decorative ambient background accents */}
      <div className="pointer-events-none absolute -top-12 right-0 -z-10 h-80 w-80 rounded-full bg-brand-500/10 blur-3xl dark:bg-brand-500/5" />
      <div className="pointer-events-none absolute top-48 left-0 -z-10 h-80 w-80 rounded-full bg-scout-red/5 blur-3xl" />

      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-500 text-white shadow-md shadow-brand-700/20">
          <CheckIcon className="h-8 w-8" />
        </span>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-brand-950 dark:text-brand-50 sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-base text-muted dark:text-brand-300">{t("subtitle")}</p>
      </div>

      {/* Certificate Display Card */}
      <div className="certificate-preview mt-8 overflow-hidden rounded-3xl border-2 border-gold-200/90 bg-white text-ink shadow-xl shadow-brand-950/5">
        {/* Certificate Header Banner */}
        <div className="relative border-b-2 border-gold-300 dark:border-gold-700 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-950 px-6 py-7 text-center text-white">
          <div className="pointer-events-none absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="relative flex flex-col items-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-gold-300 backdrop-blur-sm">
              <CompassMark className="h-6 w-6" />
            </span>
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.25em] text-gold-300">
              {tc("eventLine")}
            </p>
            <p className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
              {tc("course")}
            </p>
            <p className="mt-1 text-sm font-medium text-brand-200">{t("congrats")}</p>
          </div>
        </div>

        {/* Certificate Body */}
        <div className="bg-white p-6 text-ink sm:p-8">
          <dl className="grid gap-5 rounded-2xl border border-brand-100/80 bg-brand-50/30 p-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                {t("nameLabel")}
              </dt>
              <dd className="mt-1 text-xl font-black text-brand-950">
                {participant.nameEn}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                {t("issuedLabel")}
              </dt>
              <dd className="mt-1 text-lg font-bold text-brand-950">
                {formatDate(certificate.issuedAt, locale)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-bold uppercase tracking-wider text-muted">
                {t("certId")}
              </dt>
              <dd className="mt-1.5">
                <CopyField
                  value={certificate.id}
                  label={tc("copy")}
                  copiedLabel={tc("copied")}
                  mono
                />
              </dd>
            </div>
          </dl>

          <p className="mt-6 text-sm leading-relaxed text-muted">{t("body")}</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={`/api/certificate/${certificate.id}`}
              className={buttonClass("primary") + " shadow-sm"}
              download={`${certificate.id}.pdf`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span aria-hidden="true">↓</span> {t("download")}
            </a>
            <Link
              href={`/verify/${certificate.id}`}
              className={buttonClass("secondary")}
            >
              {t("verifyLabel")}
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted dark:text-brand-400">{t("printTip")}</p>
        </div>
      </div>

      {/* Verification Link Card */}
      <div className="mt-6 rounded-2xl border border-brand-200/80 bg-white/80 p-5 shadow-xs backdrop-blur-sm dark:border-brand-900/80 dark:bg-brand-950/60">
        <p className="text-sm font-bold text-brand-950 dark:text-brand-100">{t("verifyLabel")}</p>
        <p className="mt-1 text-xs text-muted dark:text-brand-300">{t("verifyHint")}</p>
        <div className="mt-3">
          <CopyField
            value={verifyUrl}
            label={tc("copy")}
            copiedLabel={tc("copied")}
          />
        </div>
      </div>
    </div>
  );
}
