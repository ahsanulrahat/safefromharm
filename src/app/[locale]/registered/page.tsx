import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireParticipant } from "@/lib/participant";
import { prisma } from "@/lib/prisma";
import { CopyField } from "@/components/copy-field";
import { CheckIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui";
import type { AppLocale } from "@/i18n/routing";

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
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700">
        <CheckIcon className="h-7 w-7" />
      </div>
      <h1 className="mt-4 text-3xl font-black tracking-tight text-brand-950">
        {t("title")}
      </h1>
      <p className="mt-2 text-muted">{t("subtitle")}</p>

      <div className="mt-7 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-bold text-brand-950">{t("savedTitle")}</h2>
        <p className="mt-1 text-sm text-muted">{t("savedBody")}</p>

        <div className="mt-5 space-y-4">
          <div>
            <p className="mb-1.5 text-sm font-semibold text-brand-900">
              {t("resumeCodeLabel")}
            </p>
            <CopyField
              value={participant.resumeCode}
              label={t("copyCode")}
              copiedLabel={t("copied")}
              mono
            />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-semibold text-brand-900">
              {t("resumeLinkLabel")}
            </p>
            <CopyField
              value={resumeLink}
              label={t("copyLink")}
              copiedLabel={t("copied")}
            />
          </div>
        </div>

        <p className="mt-4 rounded-lg bg-gold-50 px-3 py-2 text-xs text-gold-900">
          {t("emailNote")}
        </p>
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link href="/course" className={buttonClass("primary")}>
          {t("start")}
        </Link>
        {certificate && (
          <Link href="/certificate" className={buttonClass("secondary")}>
            {t("certificateReady")}
          </Link>
        )}
      </div>

      <p className="mt-8 text-xs text-muted">
        {tc("safeguardingTitle")} — {tc("safeguardingContact")}
      </p>
    </div>
  );
}
