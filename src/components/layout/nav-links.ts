import { routes } from "@/lib/routes";

/** Menu utama; `key` mengacu ke messages: nav.<key>. */
export const navLinks = [
  { href: routes.home, key: "home" },
  { href: routes.courses, key: "courses" },
  { href: routes.pricing, key: "pricing" },
  { href: routes.reviews, key: "reviews" },
  { href: routes.contact, key: "contact" },
] as const;

/** Link dengan anchor (#) tidak pernah ditandai aktif. */
export function isActiveHref(href: string, pathname: string) {
  if (href.includes("#")) return false;
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
