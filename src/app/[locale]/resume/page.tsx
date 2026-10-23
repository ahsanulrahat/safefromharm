import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ResumeForms } from "@/components/resume-forms";
import { SafeguardingBox } from "@/components/safeguarding-box";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata() {
  const t = await getTranslations("resume");
  return { title: t("title") };
}

export default async function ResumePage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("resume");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/" className="text-sm font-semibold text-brand-700 hover:underline">
        <span aria-hidden="true">←</span> Home
      </Link>
      <h1 className="mt-4 text-3xl font-black tracking-tight text-brand-950">
        {t("title")}
      </h1>
      <p className="mt-2 max-w-xl text-muted">{t("subtitle")}</p>

      <div className="mt-6">
        <ResumeForms locale={locale} />
      </div>

      <p className="mt-5 text-sm text-muted">
        {t("noAccount")}{" "}
        <Link href="/register" className="font-semibold text-brand-700 underline">
          {t("register")}
        </Link>
      </p>

      <div className="mt-8">
        <SafeguardingBox compact />
      </div>
    </div>
  );
}
