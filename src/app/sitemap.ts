import type { MetadataRoute } from "next";

const PUBLIC_PATHS = ["", "/register", "/resume", "/verify"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");

  return ["bn", "en"].flatMap((locale) =>
    PUBLIC_PATHS.map((path) => ({
      url: `${siteUrl}/${locale}${path}`,
      changeFrequency: path === "" ? "weekly" : "monthly",
      priority: path === "" ? 1 : 0.6,
      alternates: {
        languages: {
          bn: `${siteUrl}/bn${path}`,
          en: `${siteUrl}/en${path}`,
        },
      },
    }))
  );
}
