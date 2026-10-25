import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/admin";
import { logoutAction } from "@/actions/auth";
import { CompassMark } from "@/components/icons";
import { SafeguardingBox } from "@/components/safeguarding-box";

export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const admin = await requireAdmin(locale);
  const t = await getTranslations("admin.nav");
  const tc = await getTranslations("common");
  const canSeeSensitive = admin.role === "SAFEGUARDING" || admin.role === "SUPERADMIN";

  const links: Array<{ href: string; label: string }> = [
    { href: "/admin", label: t("dashboard") },
    { href: "/admin/participants", label: t("participants") },
    { href: "/admin/certificates", label: t("certificates") },
    { href: "/admin/content", label: t("content") },
  ];
  if (canSeeSensitive) {
    links.push({ href: "/admin/responses", label: t("responses") });
  }
  if (admin.role === "SUPERADMIN") {
    links.push({ href: "/admin/audit", label: t("audit") });
  }

  return (
    <div className="min-h-screen bg-surface-cream/50">
      <header className="sticky top-0 z-30 border-b border-brand-800/80 bg-brand-950/95 text-white shadow-md backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-3">
            <Link href="/admin" className="group flex items-center gap-2.5 font-bold">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-800 to-brand-700 text-gold-300 shadow-2xs">
                <CompassMark className="h-6 w-6" />
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-black tracking-tight">{tc("brand")}</span>
                <span className="block text-[11px] font-medium text-brand-300">
                  Admin · <span className="rounded bg-brand-800/80 px-1 py-0.5 text-gold-300 font-semibold">{admin.role}</span>
                </span>
              </span>
            </Link>
            <div className="flex items-center gap-2 text-xs">
              <span className="hidden font-mono text-xs text-brand-300 sm:inline">{admin.email}</span>
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
          <nav aria-label="Admin" className="-mx-1 flex gap-1 overflow-x-auto pb-2.5 scrollbar-none">
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
