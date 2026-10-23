import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { CheckIcon, ShieldIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ certId: string }>;
}) {
  const { certId } = await params;
  return {
    title: `Certificate ${certId}`,
    robots: { index: false, follow: false },
  };
}

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ locale: AppLocale; certId: string }>;
}) {
  const { locale, certId } = await params;
  const t = await getTranslations("verify");
  const tc = await getTranslations("common");
  const id = decodeURIComponent(certId).toUpperCase();

  const certificate = await prisma.certificate.findUnique({
    where: { id },
    include: { participant: { select: { nameEn: true } } },
  });

  if (!certificate) {
    return (
      <div className="mx-auto max-w-xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="rounded-2xl border border-gold-200 bg-gold-50 p-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-gold-700">
            <ShieldIcon className="h-6 w-6" />
          </span>
          <h1 className="mt-3 text-xl font-bold text-brand-950">{t("title")}</h1>
          <p className="mt-2 text-sm text-gold-900">{t("notFound")}</p>
          <p className="mt-2 font-mono text-xs text-muted">{id}</p>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/verify" className={buttonClass("primary")}>
            {t("submit")}
          </Link>
          <Link href="/" className={buttonClass("secondary")}>
            {t("backHome")}
          </Link>
        </div>
      </div>
    );
  }

  const valid = certificate.revokedAt === null;

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 sm:py-16">
      <div
        className={
          "overflow-hidden rounded-3xl border shadow-sm " +
          (valid ? "border-brand-200 bg-white" : "border-red-200 bg-white")
        }
      >
        <div
          className={
            "px-6 py-5 text-center " +
            (valid ? "bg-brand-700 text-white" : "bg-red-700 text-white")
          }
        >
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
            {valid ? (
              <CheckIcon className="h-7 w-7" />
            ) : (
              <ShieldIcon className="h-7 w-7" />
            )}
          </span>
          <h1 className="mt-2 text-xl font-bold">
            {valid ? t("valid") : t("invalid")}
          </h1>
          {!valid && <p className="mt-1 text-sm text-red-100">{t("revoked")}</p>}
        </div>

        <dl className="divide-y divide-brand-100 px-6">
          <div className="py-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t("name")}
            </dt>
            <dd className="mt-0.5 text-lg font-bold text-brand-950">
              {certificate.participant.nameEn}
            </dd>
          </div>
          <div className="py-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t("course")}
            </dt>
            <dd className="mt-0.5 font-semibold text-brand-900">{tc("course")}</dd>
          </div>
          <div className="py-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t("issued")}
            </dt>
            <dd className="mt-0.5 font-semibold text-brand-900">
              {formatDate(certificate.issuedAt, locale)}
            </dd>
          </div>
          <div className="py-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t("certIdLabel")}
            </dt>
            <dd className="mt-0.5 font-mono text-sm font-semibold text-brand-900">
              {certificate.id}
            </dd>
          </div>
        </dl>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted">{t("privacy")}</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href="/verify" className={buttonClass("secondary")}>
          {t("submit")}
        </Link>
        <Link href="/" className={buttonClass("ghost")}>
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
