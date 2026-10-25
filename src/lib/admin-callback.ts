import { localePath } from "@/i18n/locale-path";

const ADMIN_PREFIXES = ["/admin", "/organizer", "/control-center"] as const;

/**
 * Only allow post-login redirects into organizer/admin paths for the
 * current locale. Blocks open redirects.
 */
export function safeAdminCallback(
  locale: string,
  raw: FormDataEntryValue | string | null | undefined
): string {
  const fallback = localePath(locale, "/admin");
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value) return fallback;
  if (value.includes("://") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  const pathOnly = value.split("?")[0] ?? value;
  const allowed = ADMIN_PREFIXES.some((prefix) => {
    const canonical = localePath(locale, prefix);
    return pathOnly === canonical || pathOnly.startsWith(`${canonical}/`);
  });
  return allowed ? pathOnly : fallback;
}
