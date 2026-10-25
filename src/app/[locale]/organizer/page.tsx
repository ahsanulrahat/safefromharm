import { redirect } from "next/navigation";
import type { AppLocale } from "@/i18n/routing";
import { localePath } from "@/i18n/locale-path";

/**
 * Organizer bookmark URL for the admin dashboard (participant counts,
 * certificates, content, etc.). Kept separate from /admin so the entry
 * link is easy to share with the organizing team.
 */
export const dynamic = "force-dynamic";

export default async function OrganizerDashboardEntry({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  redirect(localePath(locale, "/admin"));
}
