import { siteConfig } from "@/config/site";
import { routing } from "@/i18n/routing";

/** URL absolut halaman publik, mis. absoluteUrl("id", "/courses") → https://…/id/courses */
export function absoluteUrl(locale: string, path: string) {
  const base = siteConfig.url.replace(/\/$/, "");
  return `${base}/${locale}${path === "/" ? "" : path}`;
}

/** `alternates` untuk generateMetadata: canonical + hreflang yang menunjuk halaman yang sama. */
export function pageAlternates(locale: string, path: string) {
  return {
    canonical: absoluteUrl(locale, path),
    languages: Object.fromEntries(
      routing.locales.map((l) => [l, absoluteUrl(l, path)]),
    ),
  };
}
