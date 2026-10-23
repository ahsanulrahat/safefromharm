import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("admin.audit");
  return { title: t("title"), robots: { index: false } };
}

const ACTION_TONE: Record<string, string> = {
  REFLECTION_VIEW: "bg-red-50 text-red-700",
  CERTIFICATE_REVOKE: "bg-red-50 text-red-700",
  CERTIFICATE_REISSUE: "bg-gold-100 text-gold-800",
  SETTING_UPDATE: "bg-gold-100 text-gold-800",
  PARTICIPANTS_EXPORT: "bg-gold-100 text-gold-800",
};

export default async function AuditLogPage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  await requireAdmin(locale, ["SUPERADMIN"]);
  const t = await getTranslations("admin.audit");

  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight text-brand-950 sm:text-3xl">
        {t("title")}
      </h1>
      <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>

      <div className="mt-5 overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-brand-100 text-sm">
            <thead className="bg-brand-50 text-left text-xs font-semibold uppercase tracking-wide text-brand-900">
              <tr>
                <th scope="col" className="px-4 py-3">{t("when")}</th>
                <th scope="col" className="px-4 py-3">{t("actor")}</th>
                <th scope="col" className="px-4 py-3">{t("role")}</th>
                <th scope="col" className="px-4 py-3">{t("action")}</th>
                <th scope="col" className="px-4 py-3">{t("target")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-brand-50/50">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">
                    {formatDateTime(row.createdAt, locale)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-brand-950">
                    {row.actorEmail}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-brand-800">
                    {row.actorRole}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={
                        "rounded-full px-2 py-1 font-mono text-xs font-semibold " +
                        (ACTION_TONE[row.action] ?? "bg-brand-50 text-brand-800")
                      }
                    >
                      {row.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-brand-900">
                      {row.targetType}
                    </span>
                    <span className="ml-1 break-all font-mono text-xs text-muted">
                      {row.targetId}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted">
                    {t("empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
