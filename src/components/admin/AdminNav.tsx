"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import type { Role } from "@/lib/content";
import { routes } from "@/lib/routes";

/** Menu samping CMS; menu khusus super admin disembunyikan untuk guru. */
export function AdminNav({ role }: { role: Role }) {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();
  const items = [
    { href: routes.adminCourses, label: t("courses") },
    ...(role === "super_admin"
      ? [
          { href: routes.adminLevels, label: t("levels") },
          { href: routes.adminUsers, label: t("users") },
          { href: routes.adminReviews, label: t("reviews") },
        ]
      : []),
  ];

  return (
    <nav aria-label={t("label")}>
      <ul className="flex gap-2 overflow-x-auto lg:flex-col">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "block whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                  active ? "bg-brand-strong text-on-brand" : "text-muted hover:bg-surface-2 hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
