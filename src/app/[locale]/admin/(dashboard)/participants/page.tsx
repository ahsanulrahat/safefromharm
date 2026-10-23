import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/admin";
import {
  getDistricts,
  listParticipants,
  PAGE_SIZE,
  parseParticipantFilters,
  participantQueryString,
  SECTIONS,
} from "@/lib/admin-queries";
import { buttonClass, cardClass, inputClass, labelClass } from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { AppLocale } from "@/i18n/routing";
import type { Section } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("admin.participants");
  return { title: t("title"), robots: { index: false } };
}

const sectionKey: Record<Section, "cub" | "scout" | "rover" | "leader"> = {
  CUB: "cub",
  SCOUT: "scout",
  ROVER: "rover",
  LEADER: "leader",
};

export default async function ParticipantsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  await requireAdmin(locale);
  const filters = parseParticipantFilters(await searchParams);

  const [t, tc, tr, districts, result] = await Promise.all([
    getTranslations("admin.participants"),
    getTranslations("admin.common"),
    getTranslations("register"),
    getDistricts(),
    listParticipants(filters),
  ]);

  const from =
    result.total === 0 ? 0 : (result.page - 1) * PAGE_SIZE + 1;
  const to =
    result.total === 0
      ? 0
      : Math.min(result.total, from + result.participants.length - 1);
  const exportQuery = participantQueryString({ ...filters, page: 1 });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-brand-950 sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>
        <a
          href={`/api/admin/export${exportQuery}`}
          className={buttonClass("secondary")}
        >
          <span aria-hidden="true">↓</span> {tc("exportCsv")}
        </a>
      </div>
      <p className="mt-1 text-xs text-muted">{t("exportHint")}</p>

      <form className={cardClass + " mt-5"} method="get">
        <div className="grid gap-4 md:grid-cols-12">
          <div className="md:col-span-4">
            <label className={labelClass} htmlFor="q">
              {tc("search")}
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={filters.q}
              placeholder={tc("searchPlaceholder")}
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass} htmlFor="section">
              {t("section")}
            </label>
            <select
              id="section"
              name="section"
              defaultValue={filters.section}
              className={inputClass}
            >
              <option value="">{t("allSections")}</option>
              {SECTIONS.map((section) => (
                <option key={section} value={section}>
                  {tr(`sections.${sectionKey[section]}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className={labelClass} htmlFor="district">
              {t("districtUnit")}
            </label>
            <select
              id="district"
              name="district"
              defaultValue={filters.district}
              className={inputClass}
            >
              <option value="">{t("allDistricts")}</option>
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className={labelClass} htmlFor="cert">
              {t("certStatus")}
            </label>
            <select
              id="cert"
              name="cert"
              defaultValue={filters.cert}
              className={inputClass}
            >
              <option value="all">{tc("all")}</option>
              <option value="active">{t("certActive")}</option>
              <option value="revoked">{t("certRevoked")}</option>
              <option value="none">{t("certNone")}</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" className={buttonClass("primary")}>
            {tc("apply")}
          </button>
          <Link href="/admin/participants" className={buttonClass("ghost")}>
            {tc("reset")}
          </Link>
          <span className="ml-auto self-center text-xs text-muted">
            {tc("showing", { from, to, total: result.total })}
          </span>
        </div>
      </form>

      <div className="mt-5 overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-brand-100 text-sm">
            <thead className="bg-brand-50 text-left text-xs font-semibold uppercase tracking-wide text-brand-900">
              <tr>
                <th scope="col" className="px-4 py-3">
                  {t("name")}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t("scoutId")}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t("districtUnit")}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t("section")}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t("progress")}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t("certificate")}
                </th>
                <th scope="col" className="px-4 py-3">
                  {t("registered")}
                </th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">{tc("actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {result.participants.map((participant) => (
                <tr key={participant.id} className="hover:bg-brand-50/50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-brand-950">
                      {participant.nameEn}
                    </div>
                    <div className="text-xs text-muted" lang="bn">
                      {participant.fullNameBn}
                      {participant.isMinor ? " · U18" : ""}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-brand-900">
                    {participant.scoutId}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-brand-900">{participant.district}</div>
                    <div className="text-xs text-muted">{participant.unit}</div>
                  </td>
                  <td className="px-4 py-3">
                    {tr(`sections.${sectionKey[participant.section]}`)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="font-semibold text-brand-900">
                      {participant.completedModules} / {result.moduleCount}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {participant.certificate ? (
                      participant.certificate.revokedAt ? (
                        <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                          {t("revoked")}
                        </span>
                      ) : (
                        <span className="rounded-full bg-brand-100 px-2 py-1 text-xs font-semibold text-brand-800">
                          {t("active")}
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-muted">{t("none")}</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">
                    {formatDate(participant.createdAt, locale)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Link
                      href={`/admin/participants/${participant.id}`}
                      className="text-xs font-semibold text-brand-700 hover:underline"
                    >
                      {tc("view")}
                    </Link>
                  </td>
                </tr>
              ))}
              {result.participants.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted">
                    {t("empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {result.pages > 1 && (
        <nav
          className="mt-4 flex items-center justify-between gap-3 text-sm"
          aria-label="Pagination"
        >
          {result.page > 1 ? (
            <Link
              href={`/admin/participants${participantQueryString(filters, result.page - 1)}`}
              className={buttonClass("secondary")}
            >
              ← {tc("prev")}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted">
            {tc("page")} {result.page} {tc("of")} {result.pages}
          </span>
          {result.page < result.pages ? (
            <Link
              href={`/admin/participants${participantQueryString(filters, result.page + 1)}`}
              className={buttonClass("secondary")}
            >
              {tc("next")} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
