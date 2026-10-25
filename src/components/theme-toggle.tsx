"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

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
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  return false;
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const t = useTranslations("common");

  function toggle() {
    const next = isDark ? "light" : "dark";
    localStorage.setItem("scout_theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    window.dispatchEvent(new Event("scout-theme-change"));
  }

  const label = isDark ? t("themeLight") : t("themeDark");

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-brand-200/80 bg-white/90 text-brand-900 shadow-2xs transition-all duration-200 hover:border-brand-300 hover:bg-brand-50 active:scale-95 dark:border-brand-800 dark:bg-brand-900/60 dark:text-brand-100 dark:hover:bg-brand-800 ${className}`}
      title={label}
      aria-label={label}
      aria-pressed={isDark}
    >
      {isDark ? (
        // Sun icon for switching to light mode
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 text-gold-400"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      ) : (
        // Moon icon for switching to dark mode
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 text-brand-800"
          aria-hidden="true"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
    </button>
  );
}
