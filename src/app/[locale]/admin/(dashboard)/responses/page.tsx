import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { decryptText } from "@/lib/crypto";
import { audit } from "@/lib/audit";
import { buttonClass, cardClass, inputClass, labelClass } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import type { Prisma } from "@prisma/client";
import type { AppLocale } from "@/i18n/routing";
import { reviewWrittenSubmissionAction } from "@/actions/admin-submissions";
import { hasAdminPermission } from "@/lib/roles";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export async function generateMetadata() {
  const t = await getTranslations("admin.responses");
  return { title: t("title"), robots: { index: false } };
}

function first(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function ResponsesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
const admin = await requireAdmin(locale, "responses:read");
  const search = await searchParams;
  const moduleSlug = first(search.module).slice(0, 80);
  const participantId = first(search.participant).slice(0, 40);
  const requestedPage = Number.parseInt(first(search.page), 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const where: Prisma.StepProgressWhereInput = {
    reflectionCipher: { not: null },
    step: {
      type: { in: ["REFLECTION", "PARAGRAPH"] },
      ...(moduleSlug ? { module: { slug: moduleSlug } } : {}),
    },
    ...(participantId ? { participantId } : {}),
  };

  const [t, tc, total, modules, participant] = await Promise.all([
    getTranslations("admin.responses"),
    getTranslations("admin.common"),
    prisma.stepProgress.count({ where }),
    prisma.module.findMany({
      orderBy: { order: "asc" },
      select: { slug: true, order: true, titleBn: true, titleEn: true },
    }),
    participantId
      ? prisma.participant.findUnique({
          where: { id: participantId },
          select: { nameEn: true, scoutId: true },
        })
      : Promise.resolve(null),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const rows = await prisma.stepProgress.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip: (safePage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      participant: {
        select: { id: true, nameEn: true, fullNameBn: true, scoutId: true },
      },
      step: {
        select: {
          promptBn: true,
          promptEn: true,
          minWords: true,
          module: {
            select: { slug: true, order: true, titleBn: true, titleEn: true },
          },
        },
      },
    },
  });

  await audit({
    actorEmail: admin.email,
    actorRole: admin.role,
    action: "REFLECTION_VIEW",
    targetType: "Page",
    targetId: participantId ? `participant:${participantId}` : moduleSlug || "all",
  });

  const from = total === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const to = total === 0 ? 0 : Math.min(total, from + rows.length - 1);
  const pageHref = (target: number) => {
    const query = new URLSearchParams();
    if (moduleSlug) query.set("module", moduleSlug);
    if (participantId) query.set("participant", participantId);
    if (target > 1) query.set("page", String(target));
    const value = query.toString();
    return `/admin/responses${value ? `?${value}` : ""}`;
  };

  return (
    <div>
      <div>
        <h1 className="text-2xl font-black tracking-tight text-brand-950 sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
      </div>

      <div
        role="alert"
        className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
      >
        {t("warning")}
      </div>
      {search.error === "comment" && <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{t("revisionCommentRequired")}</p>}
      {search.error === "missing" && <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{t("submissionMissing")}</p>}

      <form className={cardClass + " mt-4"} method="get">
        {participantId && (
          <input type="hidden" name="participant" value={participantId} />
        )}
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-52 flex-1">
            <label className={labelClass} htmlFor="module">
              {t("module")}
            </label>
            <select
              id="module"
              name="module"
              defaultValue={moduleSlug}
              className={inputClass}
            >
              <option value="">{t("allModules")}</option>
              {modules.map((module) => (
                <option key={module.slug} value={module.slug}>
                  #{module.order + 1} ·{" "}
                  {locale === "bn" ? module.titleBn : module.titleEn}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={buttonClass("primary")}>
            {tc("apply")}
          </button>
          <Link href="/admin/responses" className={buttonClass("ghost")}>
            {tc("reset")}
          </Link>
          <span className="ml-auto text-xs text-muted">
            {tc("showing", { from, to, total })}
          </span>
        </div>
        {participant && (
          <p className="mt-3 text-xs font-semibold text-brand-800">
            {t("participant")}: {participant.nameEn} ({participant.scoutId})
          </p>
        )}
      </form>

      <p className="mt-2 text-xs text-muted">{t("hint")}</p>

      <div className="mt-4 space-y-3">
        {rows.map((row) => {
          let answer = "";
          let failed = false;
          try {
            answer = row.reflectionCipher ? decryptText(row.reflectionCipher) : "";
          } catch {
            failed = true;
          }
          const prompt =
            locale === "bn" ? row.step.promptBn : row.step.promptEn;
          const title =
            locale === "bn"
              ? row.step.module.titleBn
              : row.step.module.titleEn;

          return (
            <details
              key={row.id}
              className="rounded-xl border border-brand-100 bg-white p-4 shadow-sm"
            >
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-brand-950">
                      {row.participant.nameEn}{" "}
                      <span className="text-xs font-normal text-muted">
                        · {row.participant.scoutId}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      M{row.step.module.order + 1} · {title} ·{" "}
                      {formatDateTime(row.updatedAt, locale)}
                    </p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-800">
                    {row.wordCount ?? 0} {t("words")}
                    {(row.wordCount ?? 0) < row.step.minWords
                      ? ` · ${t("belowMinimum")}`
                      : ""}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-brand-900">{prompt}</p>
              </summary>

              <div className="mt-4 border-t border-brand-50 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("answer")}
                </p>
                {failed ? (
                  <p className="mt-1 text-sm font-medium text-red-700">
                    {t("decryptError")}
                  </p>
                ) : (
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                    {answer || "—"}
                  </p>
                )}
                <p className="mt-3 text-xs text-muted">
                  {t("prompt")}: {prompt}
                </p>
                <p className="mt-3 text-xs font-semibold text-brand-800 dark:text-brand-300">
                  {t("reviewStatus")}: {t(row.reviewStatus.toLowerCase())}
                  {row.reviewedAt ? ` · ${formatDateTime(row.reviewedAt, locale)}` : ""}
                </p>
                {row.reviewComment && <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{t("reviewComment")}: {row.reviewComment}</p>}
                {hasAdminPermission(admin.role, "responses:review") && (
                  <form action={reviewWrittenSubmissionAction} className="mt-4 rounded-lg border border-brand-100 bg-brand-50/30 p-3 dark:border-brand-900 dark:bg-brand-950/30">
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="submissionId" value={row.id} />
                    <input type="hidden" name="moduleSlug" value={moduleSlug} />
                    <input type="hidden" name="participantId" value={participantId} />
                    <label className="block text-xs font-semibold text-brand-900 dark:text-brand-200" htmlFor={`review-${row.id}`}>{t("reviewComment")}</label>
                    <textarea id={`review-${row.id}`} name="comment" maxLength={2000} defaultValue={row.reviewComment ?? ""} rows={2} className={inputClass + " mt-1"} />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button name="decision" value="approve" type="submit" className={buttonClass("primary")}>{t("approve")}</button>
                      <button name="decision" value="request_revision" type="submit" className={buttonClass("secondary")}>{t("requestRevision")}</button>
                    </div>
                  </form>
                )}
                <Link
                  href={`/admin/participants/${row.participant.id}`}
                  className="mt-2 inline-block text-xs font-semibold text-brand-700 hover:underline"
                >
                  {tc("view")} · {t("participant")}
                </Link>
              </div>
            </details>
          );
        })}

        {rows.length === 0 && (
          <p className="rounded-xl border border-dashed border-brand-200 bg-white p-8 text-center text-sm text-muted">
            {t("empty")}
          </p>
        )}
      </div>

      {pages > 1 && (
        <nav
          className="mt-4 flex items-center justify-between gap-3"
          aria-label={tc("paginationLabel")}
        >
          {safePage > 1 ? (
            <Link href={pageHref(safePage - 1)} className={buttonClass("secondary")}>
              ← {tc("prev")}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-xs text-muted">
            {tc("page")} {safePage} {tc("of")} {pages}
          </span>
          {safePage < pages ? (
            <Link href={pageHref(safePage + 1)} className={buttonClass("secondary")}>
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
