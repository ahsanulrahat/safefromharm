import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { RegisterForm } from "@/components/register-form";
import { SafeguardingBox } from "@/components/safeguarding-box";
import type { AppLocale } from "@/i18n/routing";

export async function generateMetadata() {
  const t = await getTranslations("register");
  return { title: t("title") };
}

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("register");
  const tc = await getTranslations("common");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
      >
        <span aria-hidden="true">←</span>
        {tc("home")}
      </Link>

      <h1 className="mt-4 text-3xl font-black tracking-tight text-brand-950 sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-2 text-muted">{t("subtitle")}</p>

      <div className="mt-6 rounded-2xl border border-brand-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-brand-950">{t("privacyTitle")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t("privacyBody")}</p>
      </div>

      <div className="mt-6 rounded-2xl border border-brand-100 bg-white p-5 shadow-sm sm:p-7">
        <RegisterForm locale={locale} />
      </div>

      <p className="mt-5 text-center text-sm text-muted">
        {t("alreadyRegistered")}{" "}
        <Link href="/resume" className="font-semibold text-brand-700 underline">
          {t("resumeLink")}
        </Link>
      </p>

      <div className="mt-8">
        <SafeguardingBox compact />
      </div>
    </div>
  );
}
