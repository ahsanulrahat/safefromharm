"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/components/ui";

export function LanguageSwitcher({ locale }: { locale: AppLocale }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function change(next: AppLocale) {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div
      className="inline-flex items-center rounded-full border border-brand-200/90 bg-white/90 p-0.5 text-xs font-bold uppercase tracking-wide shadow-2xs backdrop-blur-sm dark:border-brand-800 dark:bg-brand-900/70"
      role="group"
      aria-label="Language"
    >
      {(["bn", "en"] as const).map((code) => {
        const isActive = locale === code;
        const label = code === "bn" ? "BN" : "EN";
        return (
          <button
            key={code}
            type="button"
            onClick={() => change(code)}
            disabled={pending}
            aria-pressed={isActive}
            aria-label={code === "bn" ? "Bangla" : "English"}
            className={cn(
              "cursor-pointer rounded-full px-2.5 py-1 text-xs transition-all duration-200 active:scale-95",
              isActive
                ? "bg-gradient-to-r from-brand-700 to-brand-600 text-white shadow-xs dark:from-brand-600 dark:to-brand-500"
                : "text-brand-900 hover:bg-brand-50/80 hover:text-brand-950 dark:text-brand-200 dark:hover:bg-brand-800/70 dark:hover:text-white"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
