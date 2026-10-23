import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireParticipant } from "@/lib/participant";
import { getCourseState, recalcParticipant } from "@/lib/course";
import { formatDate } from "@/lib/format";
import { CopyField } from "@/components/copy-field";
import { CheckIcon, ShieldIcon } from "@/components/icons";
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
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-100 text-gold-700">
          <ShieldIcon className="h-7 w-7" />
        </span>
        {state.anyCertificate ? (
          <>
            <h1 className="mt-4 text-2xl font-bold text-brand-950">
              {t("revokedTitle")}
            </h1>
            <p className="mt-2 text-muted">{t("revokedBody")}</p>
          </>
        ) : (
          <>
            <h1 className="mt-4 text-2xl font-bold text-brand-950">
              {t("notReady")}
            </h1>
            <p className="mt-2 text-muted">{t("body")}</p>
          </>
        )}
        <Link href="/course" className={buttonClass("primary") + " mt-6"}>
          {tc("back")}
        </Link>
      </div>
    );
  }

  const verifyUrl = `${siteUrl}/${locale}/verify/${certificate.id}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <CheckIcon className="h-8 w-8" />
        </span>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-brand-950 sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted">{t("subtitle")}</p>
      </div>

      <div className="mt-8 overflow-hidden rounded-3xl border border-brand-200 bg-white shadow-sm">
        <div className="border-b border-gold-200 bg-brand-900 px-6 py-5 text-center text-white">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-300">
            Scout Moot 2026 · Dhaka
          </p>
          <p className="mt-1 text-2xl font-black">{tc("course")}</p>
          <p className="mt-0.5 text-sm text-brand-200">{t("congrats")}</p>
        </div>
        <div className="p-6 sm:p-8">
          <dl className="grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                {t("nameLabel")}
              </dt>
              <dd className="mt-1 text-lg font-bold text-brand-950">
                {participant.nameEn}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                {t("issuedLabel")}
              </dt>
              <dd className="mt-1 text-lg font-semibold text-brand-950">
                {formatDate(certificate.issuedAt, locale)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                {t("certId")}
              </dt>
              <dd className="mt-1">
                <CopyField
                  value={certificate.id}
                  label={tc("copy")}
                  copiedLabel={tc("copied")}
                  mono
                />
              </dd>
            </div>
          </dl>

          <p className="mt-6 text-sm text-muted">{t("body")}</p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <a
              href={`/api/certificate/${certificate.id}`}
              className={buttonClass("primary")}
              download={`${certificate.id}.pdf`}
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
          <p className="mt-3 text-xs text-muted">{t("printTip")}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50 p-4">
        <p className="text-sm font-semibold text-brand-900">{t("verifyLabel")}</p>
        <p className="mt-1 text-xs text-muted">{t("verifyHint")}</p>
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
