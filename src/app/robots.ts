import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { routing } from "@/i18n/routing";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Route teknis (callback login) dan CMS tidak perlu dirayapi.
      disallow: routing.locales.flatMap((l) => [`/${l}/auth/`, `/${l}/admin`]),
    },
    sitemap: `${siteConfig.url.replace(/\/$/, "")}/sitemap.xml`,
  };
}
