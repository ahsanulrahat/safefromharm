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
      <div className="relative mx-auto max-w-xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="rounded-3xl border border-gold-200 bg-gold-50/80 p-8 text-center shadow-sm backdrop-blur-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-gold-700 shadow-xs">
            <ShieldIcon className="h-7 w-7" />
          </span>
          <h1 className="mt-4 text-2xl font-black text-brand-950">{t("title")}</h1>
          <p className="mt-2 text-sm font-medium text-gold-950">{t("notFound")}</p>
          <p className="mt-3 inline-block rounded-lg border border-gold-200 bg-white px-3 py-1 font-mono text-xs font-semibold text-muted">
            {id}
          </p>
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
    <div className="relative mx-auto max-w-xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Decorative ambient background accents */}
      <div className="pointer-events-none absolute -top-10 right-0 -z-10 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />

      <div
        className={
          "overflow-hidden rounded-3xl border shadow-lg transition-all " +
          (valid
            ? "border-brand-200/90 bg-white shadow-brand-950/5"
            : "border-red-200 bg-white shadow-red-950/5")
        }
      >
        <div
          className={
            "px-6 py-6 text-center " +
            (valid
              ? "bg-gradient-to-br from-brand-800 via-brand-700 to-emerald-700 text-white"
              : "bg-gradient-to-br from-red-800 via-red-700 to-rose-700 text-white")
          }
        >
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-inner">
            {valid ? (
              <CheckIcon className="h-8 w-8 text-white" />
            ) : (
              <ShieldIcon className="h-8 w-8 text-white" />
            )}
          </span>
          <h1 className="mt-3 text-2xl font-black tracking-tight">
            {valid ? t("valid") : t("invalid")}
          </h1>
          {!valid && <p className="mt-1 text-sm text-red-100">{t("revoked")}</p>}
        </div>

        <dl className="divide-y divide-brand-100/80 px-6 py-2">
          <div className="py-4">
            <dt className="text-xs font-bold uppercase tracking-wider text-muted">
              {t("name")}
            </dt>
            <dd className="mt-1 text-xl font-black text-brand-950">
              {certificate.participant.nameEn}
            </dd>
          </div>
          <div className="py-4">
            <dt className="text-xs font-bold uppercase tracking-wider text-muted">
              {t("course")}
            </dt>
            <dd className="mt-1 text-base font-bold text-brand-900">{tc("course")}</dd>
          </div>
          <div className="py-4">
            <dt className="text-xs font-bold uppercase tracking-wider text-muted">
              {t("issued")}
            </dt>
            <dd className="mt-1 text-base font-semibold text-brand-900">
              {formatDate(certificate.issuedAt, locale)}
            </dd>
          </div>
          <div className="py-4">
            <dt className="text-xs font-bold uppercase tracking-wider text-muted">
              {t("certIdLabel")}
            </dt>
            <dd className="mt-1 font-mono text-sm font-bold text-brand-900">
              {certificate.id}
            </dd>
          </div>
        </dl>
      </div>

      <p className="mt-4 rounded-xl border border-brand-100/70 bg-brand-50/40 p-3 text-xs leading-relaxed text-muted">
        {t("privacy")}
      </p>

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
