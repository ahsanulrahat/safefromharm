import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { first } from "@/lib/admin-queries";
import { buttonClass, inputClass, labelClass } from "@/components/ui";
import type { Prisma } from "@prisma/client";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 50;

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

function auditJson(value: unknown) {
  return value ? JSON.stringify(value, null, 2) : "—";
}

export default async function AuditLogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  await requireAdmin(locale, "audit:read");
  const search = await searchParams;
  const action = first(search.action).trim().slice(0, 80);
  const actor = first(search.actor).trim().slice(0, 120);
  const target = first(search.target).trim().slice(0, 120);
  const requestedPage = Number.parseInt(first(search.page), 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const conditions: Prisma.AuditLogWhereInput[] = [];
  if (action) conditions.push({ action: { contains: action, mode: "insensitive" } });
  if (actor) conditions.push({ OR: [
    { actorEmail: { contains: actor, mode: "insensitive" } },
    { actorId: { contains: actor, mode: "insensitive" } },
  ] });
  if (target) conditions.push({ OR: [
    { targetType: { contains: target, mode: "insensitive" } },
    { targetId: { contains: target, mode: "insensitive" } },
  ] });
  const where: Prisma.AuditLogWhereInput = conditions.length ? { AND: conditions } : {};
  const [t, tc, total] = await Promise.all([
    getTranslations("admin.audit"),
    getTranslations("admin.common"),
    prisma.auditLog.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const rows = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (safePage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });
  const pageHref = (targetPage: number) => {
    const query = new URLSearchParams();
    if (action) query.set("action", action);
    if (actor) query.set("actor", actor);
    if (target) query.set("target", target);
    if (targetPage > 1) query.set("page", String(targetPage));
    const queryString = query.toString();
    return `/admin/audit${queryString ? `?${queryString}` : ""}`;
  };
  const from = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to = total === 0 ? 0 : Math.min(total, from + rows.length - 1);

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight text-brand-950 sm:text-3xl">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      <form className="mt-5 grid gap-3 rounded-2xl border border-brand-100 bg-white p-4 shadow-sm sm:grid-cols-4">
        <div><label className={labelClass} htmlFor="audit-action">{t("action")}</label><input id="audit-action" name="action" defaultValue={action} className={inputClass} maxLength={80} /></div>
        <div><label className={labelClass} htmlFor="audit-actor">{t("actor")}</label><input id="audit-actor" name="actor" defaultValue={actor} className={inputClass} maxLength={120} /></div>
        <div><label className={labelClass} htmlFor="audit-target">{t("target")}</label><input id="audit-target" name="target" defaultValue={target} className={inputClass} maxLength={120} /></div>
        <div className="flex items-end gap-2"><button className={buttonClass("primary")}>{tc("apply")}</button><Link href="/admin/audit" className={buttonClass("ghost")}>{tc("reset")}</Link></div>
      </form>
      <div className="mt-3 flex items-center justify-between text-xs text-muted">
        <span>{tc("showing", { from, to, total })}</span>
        <div className="flex gap-2">
          {safePage > 1 && <Link href={pageHref(safePage - 1)} className={buttonClass("secondary")}>{tc("prev")}</Link>}
          {safePage < pages && <Link href={pageHref(safePage + 1)} className={buttonClass("secondary")}>{tc("next")}</Link>}
        </div>
      </div>
      <div className="mt-3 overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-brand-100 text-sm">
            <thead className="bg-brand-50 text-left text-xs font-semibold uppercase tracking-wide text-brand-900">
              <tr>
                <th scope="col" className="px-4 py-3">{t("when")}</th>
                <th scope="col" className="px-4 py-3">{t("actor")}</th>
                <th scope="col" className="px-4 py-3">{t("role")}</th>
                <th scope="col" className="px-4 py-3">{t("action")}</th>
                <th scope="col" className="px-4 py-3">{t("target")}</th>
                <th scope="col" className="px-4 py-3">{t("ip")}</th>
                <th scope="col" className="px-4 py-3">{t("userAgent")}</th>
                <th scope="col" className="px-4 py-3">{t("changes")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {rows.map((row) => (
                <tr key={row.id} className="align-top hover:bg-brand-50/50">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">{formatDateTime(row.createdAt, locale)}</td>
                  <td className="px-4 py-3"><span className="whitespace-nowrap text-brand-950">{row.actorEmail}</span><span className="block font-mono text-[10px] text-muted">{row.actorId ?? "—"}</span></td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-brand-800">{row.actorRole}</td>
                  <td className="whitespace-nowrap px-4 py-3"><span className={"rounded-full px-2 py-1 font-mono text-xs font-semibold " + (ACTION_TONE[row.action] ?? "bg-brand-50 text-brand-800")}>{row.action}</span></td>
                  <td className="max-w-56 px-4 py-3"><span className="block text-xs font-semibold text-brand-900">{row.targetType}</span><span className="break-all font-mono text-xs text-muted">{row.targetId}</span></td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">{row.ipAddress ?? "—"}</td>
                  <td className="max-w-48 px-4 py-3 text-xs text-muted">{row.userAgent ?? "—"}</td>
                  <td className="px-4 py-3"><details><summary className="cursor-pointer text-xs font-semibold text-brand-700">{t("changes")}</summary><div className="mt-2 grid min-w-72 gap-2"><div><p className="text-[10px] font-bold uppercase text-muted">{t("before")}</p><pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded bg-surface-cream p-2 text-[10px]">{auditJson(row.before)}</pre></div><div><p className="text-[10px] font-bold uppercase text-muted">{t("after")}</p><pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded bg-surface-cream p-2 text-[10px]">{auditJson(row.after)}</pre></div></div></details></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-muted">{t("empty")}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
