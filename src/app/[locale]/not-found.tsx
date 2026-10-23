import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonClass } from "@/components/ui";

export default async function NotFound() {
  const t = await getTranslations("verify");

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <p className="text-6xl font-black text-brand-200">404</p>
      <h1 className="mt-4 text-2xl font-bold text-brand-950">
        {t("notFound")}
      </h1>
      <Link href="/" className={buttonClass("primary") + " mt-8"}>
        {t("backHome")}
      </Link>
    </div>
  );
}
