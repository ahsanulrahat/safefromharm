import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Inter } from "next/font/google";
import { routing } from "@/i18n/routing";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SiteChrome } from "@/components/site-chrome";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1d5b3e",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${t("title")} — Scout Moot 2026`,
      template: `%s — Safe from Harm · Scout Moot 2026`,
    },
    description: t("intro"),
    openGraph: {
      title: `${t("title")} — Scout Moot 2026`,
      description: t("subtitle"),
      type: "website",
      locale: locale === "bn" ? "bn_BD" : "en_GB",
    },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      className={inter.variable}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="preload"
          href="/fonts/SiyamRupali.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var r=document.documentElement,t=localStorage.getItem("scout_theme")||"system";r.dataset.themePreference=t;var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);r.classList.toggle("dark",d)}catch(e){}})();`,
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col bg-surface-cream text-ink transition-colors duration-200">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <a href="#main-content" className="skip-link">
            {t("skip")}
          </a>
          <SiteChrome
            header={<SiteHeader locale={locale} />}
            footer={<SiteFooter />}
          >
            {children}
          </SiteChrome>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
