import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { VerifyForm } from "@/components/verify-form";
import { ShieldIcon } from "@/components/icons";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata() {
  const t = await getTranslations("verify");
  return { title: t("title") };
}

export default async function VerifyIndexPage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("verify");

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 sm:py-16">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
        <ShieldIcon className="h-6 w-6" />
      </span>
      <h1 className="mt-4 text-3xl font-black tracking-tight text-brand-950">
        {t("title")}
      </h1>
      <p className="mt-2 text-muted">{t("subtitle")}</p>

      <VerifyForm
        label={t("formLabel")}
        placeholder={t("placeholder")}
        submit={t("submit")}
      />

      <p className="mt-6 text-xs leading-relaxed text-muted">{t("privacy")}</p>

      <Link
        href="/"
        className="mt-8 inline-block text-sm font-semibold text-brand-700 hover:underline"
      >
        <span aria-hidden="true">←</span> {t("backHome")}
      </Link>

      <input type="hidden" value={locale} readOnly />
    </div>
  );
}
