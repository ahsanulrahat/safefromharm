import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { getParticipant } from "@/lib/admin-queries";
import { getCourseState } from "@/lib/course";
import {
  reissueCertificateAction,
  revokeCertificateAction,
} from "@/actions/admin";
import { formatDate, formatDateTime } from "@/lib/format";
import { buttonClass, cardClass } from "@/components/ui";
import type { AppLocale } from "@/i18n/routing";
import type { Section } from "@prisma/client";

export const dynamic = "force-dynamic";

const sectionKey: Record<Section, "cub" | "scout" | "rover" | "leader"> = {
  CUB: "cub",
  SCOUT: "scout",
  ROVER: "rover",
  LEADER: "leader",
};

export async function generateMetadata() {
  const t = await getTranslations("admin.participant");
  return { title: t("title"), robots: { index: false } };
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 break-words font-semibold text-brand-950">{value}</dd>
    </div>
  );
}

export default async function ParticipantDetailPage({
  params,
}: {
  params: Promise<{ locale: AppLocale; id: string }>;
}) {
  const { locale, id } = await params;
  const admin = await requireAdmin(locale);
  const participant = await getParticipant(id);
  if (!participant) notFound();

  const state = await getCourseState(participant.id);
  const t = await getTranslations("admin.participant");
  const tc = await getTranslations("admin.common");
  const tr = await getTranslations("register");
  const tcert = await getTranslations("admin.certificates");
  const canSafeguard = admin.role === "SUPERADMIN" || admin.role === "SAFEGUARDING";
  const isSuperadmin = admin.role === "SUPERADMIN";

  return (
    <div>
      <Link
        href="/admin/participants"
        className="text-sm font-semibold text-brand-700 hover:underline"
      >
        ← {t("back")}
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-brand-950 sm:text-3xl">
            {participant.nameEn}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {participant.fullNameBn} ·{" "}
            <span className="font-mono text-xs">{participant.scoutId}</span>
          </p>
        </div>
        {canSafeguard && (
          <Link
            href={`/admin/responses?participant=${participant.id}`}
            className={buttonClass("secondary")}
          >
            {t("openResponses")}
          </Link>
        )}
      </div>

      <section className={cardClass + " mt-6"}>
        <h2 className="text-lg font-bold text-brand-950">{t("profile")}</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label={t("fullNameBn")} value={<span lang="bn">{participant.fullNameBn}</span>} />
          <Detail label={t("nameEn")} value={participant.nameEn} />
          <Detail
            label={t("scoutId")}
            value={<span className="font-mono">{participant.scoutId}</span>}
          />
          <Detail label={t("unit")} value={participant.unit} />
          <Detail label={t("district")} value={participant.district} />
          <Detail
            label={t("section")}
            value={tr(`sections.${sectionKey[participant.section]}`)}
          />
          <Detail
            label={t("phone")}
            value={participant.phone ?? t("contactMissing")}
          />
          <Detail
            label={t("email")}
            value={participant.email ?? t("contactMissing")}
          />
          <Detail
            label={t("minor")}
            value={participant.isMinor ? tc("yes") : tc("no")}
          />
          <Detail
            label={t("guardian")}
            value={
              participant.isMinor
                ? participant.guardianConsent
                  ? tc("yes")
                  : tc("no")
                : "—"
            }
          />
          <Detail
            label={t("consentAt")}
            value={formatDateTime(participant.consentAt, locale)}
          />
          <Detail
            label={t("registered")}
            value={formatDate(participant.createdAt, locale)}
          />
        </dl>
      </section>

      <section className={cardClass + " mt-6"}>
        <h2 className="text-lg font-bold text-brand-950">{t("modules")}</h2>
        {state.modules.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{t("noModules")}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-100 text-sm">
              <thead className="text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="py-2 pr-4">{t("module")}</th>
                  <th scope="col" className="px-3 py-2">{t("status")}</th>
                  <th scope="col" className="px-3 py-2">{t("video")}</th>
                  <th scope="col" className="px-3 py-2">{t("mcq")}</th>
                  <th scope="col" className="px-3 py-2">{t("reflections")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-50">
                {state.modules.map((module, index) => {
                  const evaluation = state.evaluations.find(
                    (e) => e.moduleId === module.id
                  );
                  const watched = state.watchedModuleIds.has(module.id);
                  const complete = Boolean(evaluation?.complete);
                  const started =
                    watched ||
                    (evaluation?.mcqCorrect ?? 0) > 0 ||
                    (evaluation?.reflectionsDone ?? 0) > 0;
                  return (
                    <tr key={module.id}>
                      <td className="py-3 pr-4 font-semibold text-brand-950">
                        {index + 1}.{" "}
                        {locale === "bn" ? module.titleBn : module.titleEn}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={
                            "rounded-full px-2 py-1 text-xs font-semibold " +
                            (complete
                              ? "bg-brand-100 text-brand-800"
                              : started
                                ? "bg-gold-100 text-gold-800"
                                : "bg-brand-50 text-muted")
                          }
                        >
                          {complete
                            ? t("complete")
                            : started
                              ? t("inProgress")
                              : t("notStarted")}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {watched ? "✓" : "—"}
                      </td>
                      <td className="px-3 py-3">
                        {evaluation
                          ? `${evaluation.mcqCorrect}/${evaluation.mcqTotal} (≥ ${evaluation.mcqRequired})`
                          : "—"}
                      </td>
                      <td className="px-3 py-3">
                        {evaluation && evaluation.reflectionsTotal > 0
                          ? `${evaluation.reflectionsDone}/${evaluation.reflectionsTotal}`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={cardClass + " mt-6"}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-brand-950">{t("certificates")}</h2>
          {!isSuperadmin && (
            <p className="text-xs text-muted">{tcert("viewerNote")}</p>
          )}
        </div>

        {participant.certificates.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{t("noCertificates")}</p>
        ) : (
          <div className="mt-4 space-y-4">
            {participant.certificates.map((certificate) => {
              const active = certificate.revokedAt === null;
              return (
                <article
                  key={certificate.id}
                  className="rounded-xl border border-brand-100 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm font-bold text-brand-950">
                        {certificate.id}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {t("issued")}: {formatDate(certificate.issuedAt, locale)}
                        {certificate.revokedAt
                          ? ` · ${t("revokedAt")}: ${formatDate(certificate.revokedAt, locale)}`
                          : ""}
                      </p>
                      {certificate.revokedReason && (
                        <p className="mt-1 text-xs text-red-700">
                          {t("reason")}: {certificate.revokedReason}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={
                          "rounded-full px-2 py-1 text-xs font-semibold " +
                          (active
                            ? "bg-brand-100 text-brand-800"
                            : "bg-red-50 text-red-700")
                        }
                      >
                        {active ? tcert("active") : tcert("revoked")}
                      </span>
                      <a
                        href={`/api/certificate/${certificate.id}`}
                        className={buttonClass("secondary")}
                      >
                        {t("download")}
                      </a>
                      <Link
                        href={`/verify/${certificate.id}`}
                        className={buttonClass("ghost")}
                      >
                        {t("verify")}
                      </Link>
                    </div>
                  </div>

                  {isSuperadmin && (
                    <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-brand-50 pt-3">
                      {active ? (
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
                              className="mt-1 rounded-lg border border-brand-200 px-3 py-2 text-sm"
                            />
                          </div>
                          <button type="submit" className={buttonClass("danger")}>
                            {t("revoke")}
                          </button>
                        </form>
                      ) : (
                        <form action={reissueCertificateAction}>
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="id" value={certificate.id} />
                          <button type="submit" className={buttonClass("primary")}>
                            {t("reissue")}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
        <p className="mt-4 text-xs text-muted">{t("reflectionsNote")}</p>
      </section>
    </div>
  );
}
