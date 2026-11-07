"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { FilterPills } from "@/components/ui/FilterPills";
import type { LevelId } from "@/config/courses";
import { seedReviews, type Review } from "@/config/reviews";
import { useAuth } from "@/lib/auth";
import { levelFilterOptions } from "@/lib/course-utils";
import { useUserReviews } from "@/lib/user-reviews";
import { ReviewCard } from "@/components/review/ReviewCard";
import { ReviewForm } from "@/components/review/ReviewForm";

export function ReviewsBoard({ formEnabled }: { formEnabled: boolean }) {
  const t = useTranslations("reviews");
  const locale = useLocale();
  const { user } = useAuth();
  const { reviews: mine, add } = useUserReviews();
  const [filter, setFilter] = useState<LevelId | "all">("all");

  const visible: (Review & { mine?: boolean })[] = [
    ...mine.map((r) => ({ ...r, mine: true })),
    ...seedReviews,
  ].filter((r) => filter === "all" || r.levelId === filter);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <div>
        <FilterPills
          label={t("level")}
          options={levelFilterOptions(locale, t("filterAll"))}
          value={filter}
          onChange={setFilter}
        />

        <ul className="mt-6 grid gap-6 md:grid-cols-2">
          {visible.map((r) => (
            <li key={r.id}>
              <ReviewCard review={r} highlight={r.mine} />
            </li>
          ))}
        </ul>
      </div>

      {formEnabled && (
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <ReviewForm defaultName={user?.name ?? ""} onSubmit={add} />
        </aside>
      )}
    </div>
  );
}
