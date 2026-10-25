import type { AppLocale } from "@/i18n/routing";

export function localizedText(locale: AppLocale, primary: string, secondary: string) {
  const preferred = locale === "bn" ? primary : secondary;
  const fallback = locale === "bn" ? secondary : primary;
  return preferred?.trim() ? preferred : fallback;
}
