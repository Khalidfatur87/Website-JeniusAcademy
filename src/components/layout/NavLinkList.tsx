"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { isActiveHref, navLinks } from "./nav-links";

/** Daftar menu utama; `desktop` = horizontal, `mobile` = vertikal penuh. */
export function NavLinkList({ variant }: { variant: "desktop" | "mobile" }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const mobile = variant === "mobile";

  return (
    <ul className={clsx("flex", mobile ? "flex-col" : "items-center gap-1")}>
      {navLinks.map(({ href, key }) => {
        const active = isActiveHref(href, pathname);
        return (
          <li key={key}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "font-medium transition-colors",
                mobile
                  ? "block rounded-xl px-3 py-3 text-base"
                  : "rounded-lg px-3.5 py-2 text-[0.95rem]",
                active
                  ? "bg-brand/10 text-brand-ink"
                  : mobile
                    ? "text-ink"
                    : "text-muted hover:text-ink",
              )}
            >
              {t(key)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
