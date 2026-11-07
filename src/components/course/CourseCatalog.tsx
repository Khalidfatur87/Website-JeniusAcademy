"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { FilterPills } from "@/components/ui/FilterPills";
import { Icon } from "@/components/ui/Icon";
import { courses, levels, tr, type LevelId } from "@/config/courses";
import { levelFilterOptions } from "@/lib/course-utils";
import { CourseCard } from "@/components/course/CourseCard";

export function CourseCatalog() {
  const t = useTranslations("courses");
  const locale = useLocale();
  const param = useSearchParams().get("level");
  const initialLevel = levels.find((l) => l.id === param)?.id;
  const [level, setLevel] = useState<LevelId | "all">(initialLevel ?? "all");
  const [query, setQuery] = useState("");
  const searchId = useId();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter((c) => {
      if (level !== "all" && c.levelId !== level) return false;
      if (!q) return true;
      return [tr(c.title, locale), tr(c.summary, locale), c.teacher].some((s) =>
        s.toLowerCase().includes(q),
      );
    });
  }, [level, query, locale]);

  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <FilterPills
          label={t("filterLabel")}
          options={levelFilterOptions(locale, t("all"))}
          value={level}
          onChange={setLevel}
        />

        <div className="relative w-full md:max-w-xs">
          <label htmlFor={searchId} className="sr-only">
            {t("search")}
          </label>
          <Icon
            name="search"
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="field pl-10"
          />
        </div>
      </div>

      <p className="mt-6 text-sm text-muted" role="status" aria-live="polite">
        {t("results", { count: filtered.length })}
      </p>

      {filtered.length ? (
        <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <li key={c.slug}>
              <CourseCard course={c} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="card mt-6 p-10 text-center text-muted">{t("empty")}</div>
      )}
    </div>
  );
}
