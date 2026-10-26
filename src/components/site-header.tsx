"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { CompassMark } from "@/components/icons";
import type { AppLocale } from "@/i18n/routing";

export function SiteHeader({ locale }: { locale: AppLocale }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = useTranslations("common");

  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/#about", label: t("navAbout") },
    { href: "/#modules", label: t("navModules") },
    { href: "/#how-it-works", label: t("navHowItWorks") },
    { href: "/verify", label: t("verify") },
    { href: "/#faq", label: t("navFaq") },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-brand-100/70 bg-white/80 shadow-2xs backdrop-blur-md dark:border-brand-900/80 dark:bg-brand-950/85 transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Brand Logo & Title */}
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-2.5 text-brand-950 dark:text-brand-50 transition-colors"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 text-white shadow-xs transition-transform duration-200 group-hover:scale-105">
            <CompassMark className="h-5 w-5" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-black tracking-tight sm:text-base">
              {t("brand")}
            </span>
            <span className="block truncate text-xs font-medium text-muted dark:text-brand-300">
              {t("course")}
            </span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          aria-label={t("mainNav")}
          className="hidden items-center gap-1 lg:flex"
        >
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl px-3 py-1.5 text-xs font-semibold text-brand-900 transition-all duration-150 hover:bg-brand-50 hover:text-brand-950 dark:text-brand-200 dark:hover:bg-brand-900/60 dark:hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Controls: Theme, Language, Actions & Mobile Toggle */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5" data-locale-controls>
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Language Switcher */}
          <LanguageSwitcher locale={locale} />

          {/* Register CTA (Desktop) */}
          <Link
            href="/register"
            className="hidden min-h-[44px] items-center rounded-xl bg-brand-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all duration-150 hover:bg-brand-800 active:scale-95 sm:inline-flex dark:bg-brand-600 dark:hover:bg-brand-500"
          >
            {t("navRegister")}
          </Link>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-brand-200/80 bg-white/90 text-brand-900 shadow-2xs transition-all hover:bg-brand-50 active:scale-95 lg:hidden dark:border-brand-800 dark:bg-brand-900/60 dark:text-brand-100"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? t("menuClose") : t("menuOpen")}
          >
            {mobileMenuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-brand-100 bg-white/95 px-4 pt-2 pb-5 shadow-lg backdrop-blur-xl lg:hidden dark:border-brand-900 dark:bg-brand-950/95 animate-fade-in-up">
          <nav aria-label={t("mobileNav")} className="flex flex-col gap-1">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-3.5 py-3 min-h-[44px] flex items-center text-sm font-semibold text-brand-950 transition hover:bg-brand-50 dark:text-brand-100 dark:hover:bg-brand-900/60"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 pt-3 border-t border-brand-100 dark:border-brand-900 flex flex-col sm:flex-row gap-2">
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 min-h-[44px] flex items-center justify-center rounded-xl bg-brand-700 py-2.5 text-center text-xs font-bold text-white shadow-xs dark:bg-brand-600"
              >
                {t("navRegister")}
              </Link>
              <Link
                href="/resume"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 min-h-[44px] flex items-center justify-center rounded-xl border border-brand-200 bg-white py-2.5 text-center text-xs font-bold text-brand-900 shadow-2xs dark:border-brand-800 dark:bg-brand-900/60 dark:text-brand-100"
              >
                {t("resume")}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
