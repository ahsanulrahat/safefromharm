import { redirect } from "next/navigation";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function ControlCenterPage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/admin`);
}
