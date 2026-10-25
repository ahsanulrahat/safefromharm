import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/admin";
import { logoutAction } from "@/actions/auth";
import { CompassMark } from "@/components/icons";
import { SafeguardingBox } from "@/components/safeguarding-box";
import { LocaleControls } from "@/components/locale-controls";
import type { AppLocale } from "@/i18n/routing";
import { hasAdminPermission } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const appLocale = locale as AppLocale;
  const admin = await requireAdmin(locale);
  const t = await getTranslations("admin.nav");
  const tc = await getTranslations("common");
  const links: Array<{ href: string; label: string }> = [];
  if (hasAdminPermission(admin.role, "dashboard:read")) links.push({ href: "/admin", label: t("dashboard") });
  if (hasAdminPermission(admin.role, "participants:read")) links.push({ href: "/admin/participants", label: t("participants") });
  if (hasAdminPermission(admin.role, "certificates:read")) links.push({ href: "/admin/certificates", label: t("certificates") });
  if (hasAdminPermission(admin.role, "content:read")) links.push({ href: "/admin/content", label: t("content") });
  if (hasAdminPermission(admin.role, "responses:read")) links.push({ href: "/admin/responses", label: t("responses") });
  if (hasAdminPermission(admin.role, "admins:read")) links.push({ href: "/admin/admins", label: t("admins") });
  if (hasAdminPermission(admin.role, "audit:read")) links.push({ href: "/admin/audit", label: t("audit") });
  links.push({ href: "/admin/account", label: t("account") });
  const homeHref = hasAdminPermission(admin.role, "dashboard:read")
    ? "/admin"
    : hasAdminPermission(admin.role, "content:read")
      ? "/admin/content"
      : hasAdminPermission(admin.role, "admins:read")
        ? "/admin/admins"
        : "/admin/account";

  return (
    <div className="min-h-screen bg-surface-cream/50">
      <header className="sticky top-0 z-30 border-b border-brand-800/80 bg-brand-950/95 text-white shadow-md backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-3">
            <Link href={homeHref} className="group flex items-center gap-2.5 font-bold">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-800 to-brand-700 text-gold-300 shadow-2xs">
                <CompassMark className="h-6 w-6" />
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-black tracking-tight">{tc("brand")}</span>
                <span className="block text-[11px] font-medium text-brand-300">
                  {tc("adminPortal")} · <span className="rounded bg-brand-800/80 px-1 py-0.5 text-gold-300 font-semibold">{admin.role}</span>
                </span>
              </span>
            </Link>
            <div className="flex items-center gap-2 text-xs">
              <span className="hidden font-mono text-xs text-brand-300 sm:inline">{admin.email}</span>
              <LocaleControls locale={appLocale} />
              <Link
                href="/"
                className="rounded-xl border border-brand-700/80 bg-white/5 px-2.5 py-1.5 font-semibold text-brand-100 transition hover:bg-white/10 hover:text-white"
              >
                {t("site")}
              </Link>
              <form action={logoutAction}>
                <input type="hidden" name="locale" value={locale} />
                <button
                  type="submit"
                  className="rounded-xl bg-white/10 px-2.5 py-1.5 font-semibold text-white transition hover:bg-white/20 active:scale-95"
                >
                  {t("logout")}
                </button>
              </form>
            </div>
          </div>
          <nav aria-label={t("navLabel")} className="-mx-1 flex gap-1 overflow-x-auto pb-2.5 scrollbar-none">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold text-brand-200 transition-all hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {children}
        <div className="mt-12">
          <SafeguardingBox />
        </div>
      </div>
    </div>
  );
}
