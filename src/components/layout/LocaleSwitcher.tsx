"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { localeLabels, locales, type Locale } from "@/config/site";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Icon } from "@/components/ui/Icon";

export function LocaleSwitcher() {
  const t = useTranslations("language");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{t("label")}</span>
      <Icon
        name="globe"
        size={16}
        className="pointer-events-none absolute left-3 text-muted"
      />
      <select
        title={localeLabels[locale as Locale]?.label}
        value={locale}
        disabled={pending}
        onChange={(e) =>
          startTransition(() =>
            router.replace(pathname, { locale: e.target.value as Locale }),
          )
        }
        className="h-10 cursor-pointer appearance-none rounded-xl border border-line bg-surface pl-9 pr-3 text-sm font-semibold text-ink transition hover:border-brand"
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {localeLabels[l].short}
          </option>
        ))}
      </select>
    </label>
  );
}
