import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireParticipant } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import { CopyField } from "@/components/copy-field";
import { CheckIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("registered");
  return { title: t("title"), robots: { index: false } };
}

export default async function RegisteredPage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  const participant = await requireParticipant(locale);
  const t = await getTranslations("registered");
  const tc = await getTranslations("common");

  const certificate = await prisma.certificate.findFirst({
    where: { participantId: participant.id, activeKey: participant.id },
    select: { id: true },
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const resumeLink = `${siteUrl}/r/${participant.resumeCode}?l=${locale}`;

  return (
    <div className="relative mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Decorative ambient background accents */}
      <div className="pointer-events-none absolute -top-10 right-0 -z-10 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />

      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-500 text-white shadow-md shadow-brand-700/20">
        <CheckIcon className="h-8 w-8" />
      </div>
      <h1 className="mt-5 text-3xl font-black tracking-tight text-brand-950 sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-2 text-base text-muted">{t("subtitle")}</p>

      <div className="mt-7 rounded-3xl border border-brand-200/90 bg-white p-6 shadow-sm sm:p-7">
        <h2 className="text-lg font-bold text-brand-950">{t("savedTitle")}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">{t("savedBody")}</p>

        <div className="mt-6 space-y-5">
          <div className="rounded-xl border border-brand-100/90 bg-brand-50/40 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-900">
              {t("resumeCodeLabel")}
            </p>
            <CopyField
              value={participant.resumeCode}
              label={t("copyCode")}
              copiedLabel={t("copied")}
              mono
            />
          </div>
          <div className="rounded-xl border border-brand-100/90 bg-brand-50/40 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-900">
              {t("resumeLinkLabel")}
            </p>
            <CopyField
              value={resumeLink}
              label={t("copyLink")}
              copiedLabel={t("copied")}
            />
          </div>
        </div>

        <p className="mt-5 rounded-xl border border-gold-200 bg-gold-50/80 p-3.5 text-xs font-medium text-gold-950">
          {t("emailNote")}
        </p>
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link href="/course" className={buttonClass("primary") + " shadow-sm"}>
          {t("start")}
        </Link>
        {certificate && (
          <Link href="/certificate" className={buttonClass("secondary")}>
            {t("certificateReady")}
          </Link>
        )}
      </div>

      <p className="mt-8 text-xs font-medium text-muted">
        {tc("safeguardingTitle")} — {tc("safeguardingContact")}
      </p>
    </div>
  );
}
