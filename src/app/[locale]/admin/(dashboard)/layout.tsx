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
    <div className="min-h-screen bg-brand-50/40">
      <header className="border-b border-brand-800 bg-brand-950 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-3">
            <Link href="/admin" className="flex items-center gap-2 font-bold">
              <CompassMark className="h-8 w-8 text-gold-300" />
              <span className="leading-tight">
                <span className="block text-sm">{tc("brand")}</span>
                <span className="block text-xs font-normal text-brand-200">
                  Admin · {admin.role}
                </span>
              </span>
            </Link>
            <div className="flex items-center gap-2 text-xs">
              <span className="hidden text-brand-200 sm:inline">{admin.email}</span>
              <Link
                href="/"
                className="rounded-md border border-brand-700 px-2 py-1 font-semibold hover:bg-brand-900"
              >
                {t("site")}
              </Link>
              <form action={logoutAction}>
                <input type="hidden" name="locale" value={locale} />
                <button
                  type="submit"
                  className="rounded-md bg-white/10 px-2 py-1 font-semibold hover:bg-white/20"
                >
                  {t("logout")}
                </button>
              </form>
            </div>
          </div>
          <nav aria-label="Admin" className="-mx-1 flex gap-1 overflow-x-auto pb-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-brand-100 hover:bg-brand-900 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {children}
        <div className="mt-10">
          <SafeguardingBox />
        </div>
      </div>
    </div>
  );
}
