"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import type { AppLocale } from "@/i18n/routing";

export function LocaleControls({ locale }: { locale: AppLocale }) {
  return (
    <div className="flex shrink-0 items-center gap-2" data-locale-controls>
      <ThemeToggle />
      <LanguageSwitcher locale={locale} />
    </div>
  );
}
