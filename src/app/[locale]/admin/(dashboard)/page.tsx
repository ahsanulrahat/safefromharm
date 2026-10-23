import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/admin";
import { getDashboardData } from "@/lib/admin-queries";
import {
  FunnelChart,
  RegistrationsChart,
  SectionChart,
  SimpleBarChart,
} from "@/components/admin/charts";
import { buttonClass, cardClass } from "@/components/ui";
import { formatPercent } from "@/lib/format";
import type { AppLocale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("admin.dashboard");
  return { title: t("title"), robots: { index: false } };
}

function StatCard({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={
        "rounded-2xl border p-5 shadow-sm " +
        (accent
          ? "border-brand-700 bg-brand-800 text-white"
          : "border-brand-100 bg-white")
      }
    >
      <p
        className={
          "text-xs font-semibold uppercase tracking-wide " +
          (accent ? "text-brand-200" : "text-muted")
        }
      >
        {label}
      </p>
      <p className="mt-1 text-3xl font-black tabular-nums">{value}</p>
      {hint && (
        <p className={"mt-1 text-xs " + (accent ? "text-brand-200" : "text-muted")}>
          {hint}
        </p>
      )}
    </div>
  );
}

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cardClass}>
      <h2 className="text-lg font-bold text-brand-950">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function AdminDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: AppLocale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const search = await searchParams;
  await requireAdmin(locale);
  const t = await getTranslations("admin.dashboard");
  const tc = await getTranslations("admin.common");
  const data = await getDashboardData();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-brand-950 sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>
        <Link href="/admin/participants" className={buttonClass("secondary")}>
          {tc("view")} · {t("totalParticipants")}
        </Link>
      </div>

      {search.forbidden && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-gold-300 bg-gold-50 px-4 py-3 text-sm font-semibold text-gold-900"
        >
          {t("forbidden")}
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label={t("totalParticipants")}
          value={String(data.totalParticipants)}
          hint={t("registrationsHint", { count: data.registrations30 })}
        />
        <StatCard
          label={t("completers")}
          value={String(data.completers)}
          hint={t("completionRate") + ": " + formatPercent(data.completionRate)}
          accent
        />
        <StatCard
          label={t("activeCertificates")}
          value={String(data.activeCertificates)}
        />
        <StatCard
          label={t("revokedCertificates")}
          value={String(data.revokedCertificates)}
        />
        <StatCard
          label={t("completionRate")}
          value={formatPercent(data.completionRate)}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title={t("registrationsTitle")}>
            <RegistrationsChart
              data={data.registrations.map((row) => ({
                date: row.date,
                count: row.count,
              }))}
              label={t("totalParticipants")}
            />
          </Panel>
        </div>
        <Panel title={t("bySection")}>
          {data.sections.length ? (
            <SectionChart
              data={data.sections.map((row) => ({
                name: row.name,
                count: row.count,
              }))}
            />
          ) : (
            <p className="text-sm text-muted">{t("noData")}</p>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title={t("byDistrict")}>
          {data.districts.length ? (
            <SimpleBarChart
              data={data.districts}
              horizontal
              color="#1d5b3e"
            />
          ) : (
            <p className="text-sm text-muted">{t("noData")}</p>
          )}
        </Panel>
        <Panel title={t("byUnit")}>
          {data.units.length ? (
            <SimpleBarChart data={data.units} horizontal color="#dba934" />
          ) : (
            <p className="text-sm text-muted">{t("noData")}</p>
          )}
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title={t("moduleFunnel")} hint={t("funnelHint")}>
          {data.funnel.length ? (
            <FunnelChart data={data.funnel} />
          ) : (
            <p className="text-sm text-muted">{t("noData")}</p>
          )}
        </Panel>
      </div>

      <p className="mt-6 rounded-xl border border-gold-200 bg-gold-50 px-4 py-3 text-xs text-gold-900">
        {t("sampleNote")}
      </p>
    </div>
  );
}
