import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/admin";
import {
  certificateQueryString,
  listCertificates,
  PAGE_SIZE,
  parseCertificateFilters,
} from "@/lib/admin-queries";
import {
  reissueCertificateAction,
  revokeCertificateAction,
} from "@/actions/admin";
import { buttonClass, cardClass, inputClass, labelClass } from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("admin.certificates");
  return { title: t("title"), robots: { index: false } };
}

export default async function CertificatesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const admin = await requireAdmin(locale);
  const filters = parseCertificateFilters(await searchParams);

  const [t, tc, result] = await Promise.all([
    getTranslations("admin.certificates"),
    getTranslations("admin.common"),
    listCertificates(filters),
  ]);
  const isSuperadmin = admin.role === "SUPERADMIN";
  const from = result.total === 0 ? 0 : (result.page - 1) * PAGE_SIZE + 1;
  const to =
    result.total === 0
      ? 0
      : Math.min(result.total, from + result.certificates.length - 1);

  return (
    <div>
      <div>
        <h1 className="text-2xl font-black tracking-tight text-brand-950 sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </div>

      <form className={cardClass + " mt-5"} method="get">
        <div className="grid gap-4 sm:grid-cols-12">
          <div className="sm:col-span-7">
            <label className={labelClass} htmlFor="q">
              {tc("search")}
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={filters.q}
              placeholder={t("searchPlaceholder")}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-5">
            <label className={labelClass} htmlFor="status">
              {tc("status")}
            </label>
            <select
              id="status"
              name="status"
              defaultValue={filters.status}
              className={inputClass}
            >
              <option value="all">{t("allStatuses")}</option>
              <option value="active">{t("activeOnly")}</option>
              <option value="revoked">{t("revokedOnly")}</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="submit" className={buttonClass("primary")}>
            {tc("apply")}
          </button>
          <Link href="/admin/certificates" className={buttonClass("ghost")}>
            {tc("reset")}
          </Link>
          <span className="ml-auto text-xs text-muted">
            {t("summary", {
              active: result.active,
              revoked: result.revoked,
            })}
          </span>
        </div>
      </form>

      {!isSuperadmin && (
        <p className="mt-3 rounded-lg border border-gold-200 bg-gold-50 px-3 py-2 text-xs text-gold-900">
          {t("viewerNote")}
        </p>
      )}

      <div className="mt-4 overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-brand-100 text-sm">
            <thead className="bg-brand-50 text-left text-xs font-semibold uppercase tracking-wide text-brand-900">
              <tr>
                <th scope="col" className="px-4 py-3">{t("id")}</th>
                <th scope="col" className="px-4 py-3">{t("participant")}</th>
                <th scope="col" className="px-4 py-3">{t("issued")}</th>
                <th scope="col" className="px-4 py-3">{t("status")}</th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">{tc("actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-50">
              {result.certificates.map((certificate) => {
                const active = certificate.revokedAt === null;
                return (
                  <tr key={certificate.id} className="align-top hover:bg-brand-50/50">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-brand-950">
                      <Link
                        href={`/verify/${certificate.id}`}
                        className="hover:underline"
                      >
                        {certificate.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-brand-950">
                        {certificate.participant.nameEn}
                      </div>
                      <div className="text-xs text-muted">
                        {certificate.participant.scoutId} ·{" "}
                        {certificate.participant.district}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">
                      {formatDate(certificate.issuedAt, locale)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={
                          "rounded-full px-2 py-1 text-xs font-semibold " +
                          (active
                            ? "bg-brand-100 text-brand-800"
                            : "bg-red-50 text-red-700")
                        }
                      >
                        {active ? t("active") : t("revoked")}
                      </span>
                      {!active && certificate.revokedReason && (
                        <div className="mt-1 max-w-48 text-xs text-muted">
                          {t("revokedReason")}: {certificate.revokedReason}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-start justify-end gap-2">
                        {active && (
                          <a
                            href={`/api/certificate/${certificate.id}`}
                            className={buttonClass("secondary")}
                          >
                            {t("download")}
                          </a>
                        )}
                        {isSuperadmin &&
                          (active ? (
                            <form
                              action={revokeCertificateAction}
                              className="flex flex-wrap items-end gap-2"
                            >
                              <input type="hidden" name="locale" value={locale} />
                              <input type="hidden" name="id" value={certificate.id} />
                              <div>
                                <label
                                  className="block text-xs font-semibold text-brand-900"
                                  htmlFor={`reason-${certificate.id}`}
                                >
                                  {t("reason")}
                                </label>
                                <input
                                  id={`reason-${certificate.id}`}
                                  name="reason"
                                  maxLength={200}
                                  placeholder={t("reasonPlaceholder")}
                                  className="mt-1 w-44 rounded-lg border border-brand-200 px-2 py-1.5 text-xs"
                                />
                              </div>
                              <button
                                type="submit"
                                className={buttonClass("danger")}
                              >
                                {t("revoke")}
                              </button>
                            </form>
                          ) : (
                            <form action={reissueCertificateAction}>
                              <input type="hidden" name="locale" value={locale} />
                              <input type="hidden" name="id" value={certificate.id} />
                              <button
                                type="submit"
                                className={buttonClass("primary")}
                              >
                                {t("reissue")}
                              </button>
                            </form>
                          ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {result.certificates.length === 0 && (
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

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">{t("reissueHint")}</p>
        <p className="text-xs text-muted">
          {tc("showing", { from, to, total: result.total })}
        </p>
      </div>

      {result.pages > 1 && (
        <nav
          className="mt-3 flex items-center justify-between gap-3"
          aria-label="Pagination"
        >
          {result.page > 1 ? (
            <Link
              href={`/admin/certificates${certificateQueryString(filters, result.page - 1)}`}
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
              href={`/admin/certificates${certificateQueryString(filters, result.page + 1)}`}
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
