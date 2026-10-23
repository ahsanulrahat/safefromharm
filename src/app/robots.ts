import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/bn/admin",
          "/en/admin",
          "/api/",
          "/bn/course",
          "/en/course",
          "/bn/certificate",
          "/en/certificate",
          "/bn/verify/",
          "/en/verify/",
          "/r/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
