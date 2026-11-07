"use client";

import { useTranslations } from "next-intl";
import { useTheme } from "@/lib/theme";
import { Icon } from "@/components/ui/Icon";

export function ThemeToggle() {
  const t = useTranslations("theme");
  const { dark, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={t("toggle")}
      title={dark ? t("light") : t("dark")}
      className="grid size-10 place-items-center rounded-xl border border-line bg-surface text-ink transition hover:border-brand hover:text-brand-ink"
    >
      <Icon name={dark ? "sun" : "moon"} />
    </button>
  );
}
