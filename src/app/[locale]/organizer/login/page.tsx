import { redirect } from "next/navigation";
import type { AppLocale } from "@/i18n/routing";
import { localePath } from "@/i18n/locale-path";

export default async function OrganizerLoginAlias({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  redirect(localePath(locale, "/admin/login"));
}
