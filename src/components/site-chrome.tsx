"use client";

import { usePathname } from "@/i18n/navigation";

/**
 * Renders the public site chrome everywhere except the organizer area, which
 * has its own header and navigation.
 */
export function SiteChrome({
  header,
  footer,
  children,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  return (
    <>
      {!isAdmin && header}
      <main id="main-content" className="flex-1">
        {children}
      </main>
      {!isAdmin && footer}
    </>
  );
}
