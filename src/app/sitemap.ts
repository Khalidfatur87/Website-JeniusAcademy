import type { MetadataRoute } from "next";
import { getCourses } from "@/lib/content-server";
import { routing } from "@/i18n/routing";
import { routes } from "@/lib/routes";
import { absoluteUrl } from "@/lib/seo";

const staticPaths = [routes.home, routes.courses, routes.pricing, routes.reviews];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const courses = await getCourses();
  const paths = [...staticPaths, ...courses.map((c) => routes.course(c.slug))];

  return paths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: absoluteUrl(locale, path),
      priority: path === routes.home ? 1 : 0.7,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, absoluteUrl(l, path)]),
        ),
      },
    })),
  );
}
