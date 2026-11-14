"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { FilterPills } from "@/components/ui/FilterPills";
import { seedReviews, type Review } from "@/config/reviews";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import type { Level } from "@/lib/content";
import { levelFilterOptions } from "@/lib/course-utils";
import { routes } from "@/lib/routes";
import { useUserReviews } from "@/lib/user-reviews";
import { ReviewCard } from "@/components/review/ReviewCard";
import { ReviewForm } from "@/components/review/ReviewForm";

export function ReviewsBoard({ formEnabled, levels }: { formEnabled: boolean; levels: Level[] }) {
  const t = useTranslations("reviews");
  const locale = useLocale();
  const { user } = useAuth();
  const { reviews: fromDb, add } = useUserReviews();
  const [filter, setFilter] = useState<string>("all");

  const visible: (Review & { mine?: boolean; pending?: boolean })[] = [
    ...fromDb,
    ...seedReviews,
  ].filter((r) => filter === "all" || r.levelId === filter);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <div>
        <FilterPills
          label={t("level")}
          options={levelFilterOptions(levels, locale, t("filterAll"))}
          value={filter}
          onChange={setFilter}
        />

        <ul className="mt-6 grid gap-6 md:grid-cols-2">
          {visible.map((r) => (
            <li key={r.id}>
              <ReviewCard
                review={r}
                level={levels.find((l) => l.id === r.levelId)}
                highlight={r.mine}
                pending={r.pending}
              />
            </li>
          ))}
        </ul>
      </div>

      {formEnabled && (
        <aside className="lg:sticky lg:top-24 lg:self-start">
          {user ? (
            <ReviewForm defaultName={user.name} levels={levels} onSubmit={add} />
          ) : (
            <div className="card space-y-4 p-6">
              <h2 className="text-xl">{t("formTitle")}</h2>
              <p className="text-sm text-muted">{t("loginToReview")}</p>
              <Link href={routes.login} className="btn btn-primary w-full">
                {t("loginCta")}
              </Link>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
