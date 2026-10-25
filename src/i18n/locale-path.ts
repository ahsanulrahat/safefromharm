import type { AppLocale } from "@/i18n/routing";

/** Builds the canonical path for a locale using the as-needed URL convention. */
export function localePath(locale: AppLocale | string, path: string) {
  const pathname = path.startsWith("/") ? path : `/${path}`;
  return `${locale === "bn" ? "" : `/${locale}`}${pathname}`;
}
