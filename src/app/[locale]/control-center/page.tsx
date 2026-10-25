import { redirect } from "next/navigation";
import type { AppLocale } from "@/i18n/routing";

/** Legacy alias — prefer /organizer for the dashboard entry link. */
export const dynamic = "force-dynamic";

export default async function ControlCenterPage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/organizer`);
}
