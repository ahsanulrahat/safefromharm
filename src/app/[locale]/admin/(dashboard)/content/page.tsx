import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { DEFAULT_PASS_MARK } from "@/lib/settings";
import {
  moveModuleAction,
  publishModuleVersionAction,
  saveSettingsAction,
} from "@/actions/admin";
import { ContentEditor } from "@/components/admin/content-editor";
import { buttonClass, cardClass, inputClass, labelClass } from "@/components/ui";
import type { AppLocale } from "@/i18n/routing";
import type { Step } from "@prisma/client";
import { contentModuleSchema } from "@/lib/validation";
import { hasCompleteTranslations } from "@/lib/content";
import { hasAdminPermission } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("admin.content");
  return { title: t("title"), robots: { index: false } };
}

type Option = { id: string; bn: string; en: string };

function normalizeOptions(value: unknown): Option[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (
      item &&
      typeof item === "object" &&
      "id" in item &&
      "bn" in item &&
      "en" in item &&
      typeof item.id === "string" &&
      typeof item.bn === "string" &&
      typeof item.en === "string"
    ) {
      return [{ id: item.id, bn: item.bn, en: item.en }];
    }
    return [];
  });
}

function stepJson(step: Step) {
  return {
    id: step.id,
    type: step.type,
    promptBn: step.promptBn,
    promptEn: step.promptEn,
    options: normalizeOptions(step.options),
    correctOptionId: step.correctOptionId,
    correctOptionIds: Array.isArray(step.correctOptionIds) ? step.correctOptionIds : [],
    minWords: step.minWords,
    explanationBn: step.explanationBn,
    explanationEn: step.explanationEn,
    points: step.points,
  };
}

function templateJson() {
  return {
    slug: "new-module",
    audience: "ROVER",
    titleBn: "নতুন মডিউল (SAMPLE)",
    titleEn: "New module (SAMPLE)",
    descriptionBn:
      "SAMPLE — replace with official Bangladesh Scouts Safe from Harm content.",
    descriptionEn:
      "SAMPLE — replace with official Bangladesh Scouts Safe from Harm content.",
    writtenBn: "",
    writtenEn: "",
    videoId: "aqz-KE-bpKQ",
    mustWatch: true,
    attemptsAllowed: 1,
    paragraphApprovalRequired: false,
    passMark: null,
    published: false,
    steps: [
      {
        type: "MCQ",
        promptBn: "নমুনা প্রশ্ন — এটি অফিসিয়াল কনটেন্ট নয়।",
        promptEn: "Sample question — this is not official content.",
        options: [
          { id: "a", bn: "বিকল্প ক", en: "Option A" },
          { id: "b", bn: "বিকল্প খ", en: "Option B" },
        ],
        correctOptionId: "a",
        points: 1,
        explanationBn: "",
        explanationEn: "",
      },
      {
        type: "REFLECTION",
        promptBn: "নমুনা প্রতিফলন প্রশ্ন — এটি অফিসিয়াল কনটেন্ট নয়।",
        promptEn: "Sample reflection prompt — this is not official content.",
        minWords: 30,
        points: 1,
        explanationBn: "",
        explanationEn: "",
      },
    ],
  };
}

export default async function AdminContentPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const admin = await requireAdmin(locale, "content:read");
  const search = await searchParams;
  const requestedSlug =
    typeof search.module === "string" ? search.module : "";
  const isNew = search.new === "1";

  const [t, tc, modules, setting] = await Promise.all([
    getTranslations("admin.content"),
    getTranslations("admin.common"),
    prisma.module.findMany({
      orderBy: { order: "asc" },
      include: {
        steps: { where: { archivedAt: null }, orderBy: { order: "asc" } },
        _count: { select: { progress: true } },
      },
    }),
    prisma.setting.findUnique({ where: { key: "mcqPassMark" } }),
  ]);

  const selected = requestedSlug
    ? modules.find((module) => module.slug === requestedSlug)
    : undefined;

  const versions = selected ? await prisma.moduleContentVersion.findMany({
    where: { moduleId: selected.id },
    orderBy: { version: "desc" },
    take: 20,
  }) : [];
  const requestedVersionId = typeof search.version === "string" ? search.version : "";
  const activeVersion = versions.find((version) => version.id === requestedVersionId) ??
    versions.find((version) => version.status === "DRAFT") ??
    versions.find((version) => version.status === "PUBLISHED") ?? null;
  const fallbackSnapshot = selected ? {
    slug: selected.slug,
    audience: selected.audience,
    titleBn: selected.titleBn,
    titleEn: selected.titleEn,
    descriptionBn: selected.descriptionBn,
    descriptionEn: selected.descriptionEn,
    writtenBn: selected.writtenBn,
    writtenEn: selected.writtenEn,
    videoId: selected.videoId,
    mustWatch: selected.mustWatch,
    attemptsAllowed: selected.attemptsAllowed,
    paragraphApprovalRequired: selected.paragraphApprovalRequired,
    passMark: selected.passMark,
    published: selected.published,
    steps: selected.steps.map(stepJson),
  } : templateJson();
  const rawSnapshot = activeVersion?.snapshot ?? fallbackSnapshot;
  const activeParsed = contentModuleSchema.safeParse(rawSnapshot);
  const activeSnapshot = activeParsed.success ? activeParsed.data : fallbackSnapshot;
  const editorJson = JSON.stringify(activeSnapshot, null, 2);
  const hasLanguageGap = !hasCompleteTranslations(activeSnapshot);

  const passMark = setting?.value ?? String(DEFAULT_PASS_MARK);
  const showEditor = isNew || Boolean(selected);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-brand-950 sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>
        <Link href="/admin/content?new=1" className={buttonClass("primary")}>
          + {t("newModule")}
        </Link>
      </div>

      {search.saved === "1" && (
        <p
          role="status"
          className="mt-4 rounded-lg border border-brand-300 bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-800"
        >
          {tc("saved")}
        </p>
      )}
      {search.published === "1" && <p role="status" className="mt-4 rounded-lg border border-brand-300 bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-800">{t("publishSuccess")}</p>}
      {(search.error === "reauth" || search.error === "reauth-settings") && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{t("reauthRequired")}</p>}
      {search.error === "translations" && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{t("languageGap")}</p>}
      {search.error === "slug" && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{t("slugAlreadyUsed")}</p>}
      {search.error === "pass-mark" && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{t("invalidPassMark")}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <section className={cardClass + " lg:col-span-2"}>
          <h2 className="text-lg font-bold text-brand-950">{t("modules")}</h2>
          <ul className="mt-4 space-y-3">
            {modules.map((module) => (
              <li
                key={module.id}
                className={
                  "rounded-xl border p-3 " +
                  (selected?.id === module.id
                    ? "border-brand-500 bg-brand-50"
                    : "border-brand-100")
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted">
                      #{module.order + 1} ·{" "}
                      {module.published ? t("published") : t("unpublished")}
                    </p>
                    <p className="truncate font-bold text-brand-950">
                      {locale === "bn" ? module.titleBn : module.titleEn}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {module.steps.length} {t("steps")} ·{" "}
                      {module._count.progress} {t("participantsCount")}
                    </p>
                  </div>
                  <Link
                    href={`/admin/content?module=${module.slug}`}
                    className="shrink-0 text-xs font-semibold text-brand-700 hover:underline"
                  >
                    {selected?.id === module.id ? t("editing") : t("edit")}
                  </Link>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <form action={moveModuleAction}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="slug" value={module.slug} />
                    <input type="hidden" name="direction" value="up" />
                    <button
                      type="submit"
                      className="rounded-md border border-brand-200 px-2 py-1 text-xs font-semibold text-brand-800 hover:bg-white"
                    >
                      ↑ {t("moveUp")}
                    </button>
                  </form>
                  <form action={moveModuleAction}>
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="slug" value={module.slug} />
                    <input type="hidden" name="direction" value="down" />
                    <button
                      type="submit"
                      className="rounded-md border border-brand-200 px-2 py-1 text-xs font-semibold text-brand-800 hover:bg-white"
                    >
                      ↓ {t("moveDown")}
                    </button>
                  </form>
                </div>
              </li>
            ))}
            {modules.length === 0 && (
              <li className="rounded-xl border border-dashed border-brand-200 p-4 text-sm text-muted">
                {t("selectModule")}
              </li>
            )}
          </ul>
        </section>

        <section className={cardClass + " lg:col-span-3"}>
          <h2 className="text-lg font-bold text-brand-950">
            {isNew ? t("editorNewTitle") : t("editorTitle")}
          </h2>
          <p className="mt-0.5 text-xs text-muted">{t("editorHint")}</p>

          {showEditor ? (
            <>
              <ContentEditor
                locale={locale}
                originalSlug={selected?.slug ?? ""}
                initialJson={editorJson}
                hasLanguageGap={hasLanguageGap}
                videoPreviewLabels={{ videoPreview: t("videoPreview"), previewAs: t("previewAs"), rover: t("rover"), leader: t("leader") }}
                labels={{
                  title: t("editorTitle"),
                  hint: t("editorHint"),
                  jsonLabel: t("jsonLabel"),
                  format: t("format"),
                  formatError: t("formatError"),
                  save: t("saveDraft"),
                  saving: t("savingDraft"),
                  cancel: t("cancel"),
                  validationTitle: t("validationTitle"),
                  idNote: t("idNote"),
                  languageGap: t("languageGap"),
                  exportJson: t("exportJson"),
                  importHint: t("importHint"),
                  invalidVideo: t("invalidVideo"),
                }}
              />
              <p className="mt-3 text-xs text-muted">
                {isNew ? t("templateNote") : t("sampleNote")}
              </p>
            </>
          ) : (
            <p className="mt-3 rounded-xl border border-dashed border-brand-200 p-6 text-sm text-muted">
              {t("selectModule")}
            </p>
          )}
        </section>
      </div>

      {selected && (
        <section className={cardClass + " mt-6"}>
          <h2 className="text-lg font-bold text-brand-950">{t("versionHistory")}</h2>
          <p className="mt-1 text-xs text-muted">{t("versionHistoryHint")}</p>
          <ul className="mt-4 space-y-3">
            {versions.map((version) => (
              <li key={version.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-100 p-3">
                <div>
                  <p className="font-semibold text-brand-950">{t("versionNumber", { version: version.version })} · {t(version.status.toLowerCase())}</p>
                  <p className="text-xs text-muted">{version.createdAt.toLocaleString(locale === "bn" ? "bn-BD" : "en-GB")}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/content?module=${encodeURIComponent(selected.slug)}&version=${encodeURIComponent(version.id)}`} className={buttonClass("secondary")}>{t("editVersion")}</Link>
                  {version.status === "DRAFT" && (
                    <form action={publishModuleVersionAction} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="versionId" value={version.id} />
                      <input type="hidden" name="mode" value="publish" />
                      <label className="text-xs font-semibold text-muted">
                        {t("confirmPassword")}
                        <input className={inputClass + " mt-1 min-w-48"} type="password" name="currentPassword" autoComplete="current-password" required />
                      </label>
                      <button type="submit" className={buttonClass("primary")}>{t("publish")}</button>
                    </form>
                  )}
                  {version.status === "ARCHIVED" && (
                    <form action={publishModuleVersionAction} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="versionId" value={version.id} />
                      <input type="hidden" name="mode" value="rollback" />
                      <label className="text-xs font-semibold text-muted">
                        {t("confirmPassword")}
                        <input className={inputClass + " mt-1 min-w-48"} type="password" name="currentPassword" autoComplete="current-password" required />
                      </label>
                      <button type="submit" className={buttonClass("secondary")}>{t("rollback")}</button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasAdminPermission(admin.role, "settings:write") && <section className={cardClass + " mt-6 max-w-xl"}>
        <h2 className="text-lg font-bold text-brand-950">{t("settingsTitle")}</h2>
        <p className="mt-0.5 text-xs text-muted">{t("settingsHint")}</p>
        <form action={saveSettingsAction} className="mt-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="locale" value={locale} />
          <div className="w-40">
            <label className={labelClass} htmlFor="passMark">
              {t("passMark")}
            </label>
            <input
              id="passMark"
              name="passMark"
              type="number"
              min={0}
              max={100}
              step={1}
              defaultValue={passMark}
              className={inputClass}
              required
            />
          </div>
          <div className="min-w-52 flex-1">
            <label className={labelClass} htmlFor="passMarkPassword">{t("confirmPassword")}</label>
            <input id="passMarkPassword" name="currentPassword" type="password" autoComplete="current-password" required className={inputClass} />
          </div>
          <button type="submit" className={buttonClass("primary")}>
            {t("saveSettings")}
          </button>
        </form>
        <p className="mt-3 rounded-lg border border-gold-200 bg-gold-50 px-3 py-2 text-xs text-gold-900">
          {t("sampleNote")}
        </p>
      </section>}
    </div>
  );
}
