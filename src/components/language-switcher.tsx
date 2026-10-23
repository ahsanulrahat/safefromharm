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
      className="flex items-center rounded-full border border-brand-200 bg-white p-0.5 text-xs font-semibold"
      role="group"
      aria-label="Language"
    >
      {(["bn", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => change(code)}
          disabled={pending}
          aria-pressed={locale === code}
          className={cn(
            "rounded-full px-2.5 py-1 transition",
            locale === code
              ? "bg-brand-700 text-white"
              : "text-brand-800 hover:bg-brand-50"
          )}
        >
          {code === "bn" ? "বাংলা" : "EN"}
        </button>
      ))}
    </div>
  );
}
