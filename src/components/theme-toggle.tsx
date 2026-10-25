"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

type ThemePreference = "system" | "light" | "dark";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("scout-theme-change", callback);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("scout-theme-change", callback);
    media.removeEventListener("change", callback);
  };
}

function getSnapshot() {
  return `${document.documentElement.dataset.themePreference ?? "system"}:${document.documentElement.classList.contains("dark")}`;
}

function getServerSnapshot() {
  return "system:false";
}

function setPreference(theme: ThemePreference) {
  localStorage.setItem("scout_theme", theme);
  const root = document.documentElement;
  root.dataset.themePreference = theme;
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
  window.dispatchEvent(new Event("scout-theme-change"));
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [preference, dark] = snapshot.split(":") as [ThemePreference, string];
  const t = useTranslations("common");
  const label = preference === "system" ? t("themeSystem") : preference === "dark" ? t("themeDark") : t("themeLight");

  return (
    <details className={`theme-control relative ${className}`}>
      <summary className="flex h-11 w-11 min-h-[44px] min-w-[44px] cursor-pointer list-none items-center justify-center rounded-xl border border-brand-200/80 bg-white/90 text-brand-900 shadow-2xs hover:bg-brand-50 dark:border-brand-800 dark:bg-brand-900/60 dark:text-brand-100" aria-label={`${t("theme")}: ${label}`} title={`${t("theme")}: ${label}`}>
        <span aria-hidden="true" className="text-lg">{preference === "system" ? "◐" : dark === "true" ? "☀" : "☾"}</span>
      </summary>
      <div className="absolute right-0 top-full z-50 mt-2 min-w-40 rounded-xl border border-border bg-card p-1 shadow-lg" role="group" aria-label={t("theme")}>
        {(["light", "dark", "system"] as const).map((theme) => (
          <button key={theme} type="button" onClick={() => setPreference(theme)} aria-pressed={preference === theme} className="min-h-11 w-full rounded-lg px-3 text-left text-sm text-primary hover:bg-card-subtle focus-visible:outline">
            {theme === "light" ? t("themeLight") : theme === "dark" ? t("themeDark") : t("themeSystem")}
          </button>
        ))}
      </div>
    </details>
  );
}
