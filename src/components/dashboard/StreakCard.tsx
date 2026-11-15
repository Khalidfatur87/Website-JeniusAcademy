"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { clampGoal, countThisWeek, currentStreak, weekDays } from "@/lib/activity";
import { useAuth } from "@/lib/auth";
import { updateWeeklyGoal } from "@/lib/profile";
import { createLocalStore } from "@/lib/store";

/** Target tamu disimpan di perangkat; pengguna login di profiles.weekly_goal. */
const guestGoal = createLocalStore<number>("ja:weekly-goal", 5);

/**
 * Streak harian + target pelajaran per minggu.
 * `lessonTimes`: waktu pelajaran selesai; `quizTimes`: waktu kuis dikerjakan (ikut menjaga streak).
 */
export function StreakCard({ lessonTimes, quizTimes }: { lessonTimes: string[]; quizTimes: string[] }) {
  const t = useTranslations("streak");
  const { user } = useAuth();
  const localGoal = guestGoal.useValue();
  const goal = user ? user.weeklyGoal : localGoal;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(goal);

  const all = [...lessonTimes, ...quizTimes];
  const streak = currentStreak(all);
  const week = countThisWeek(lessonTimes);
  const days = weekDays(all);
  const dayLabels = t("days").split(",");

  const save = async () => {
    const next = clampGoal(draft);
    if (user) await updateWeeklyGoal(user.id, next);
    else guestGoal.set(next);
    setEditing(false);
  };

  return (
    <section aria-label={t("label")} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="card flex items-center gap-4 p-5">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-accent/15 text-accent">
          <Icon name="flame" size={30} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted">{t("streak")}</p>
          <p className="text-3xl font-bold">{t("days_count", { count: streak })}</p>
          <ol className="mt-2 flex gap-1.5" aria-label={t("thisWeek")}>
            {days.map((active, i) => (
              <li key={i} className="flex flex-col items-center gap-1">
                <span
                  className={`size-3 rounded-full ${active ? "bg-accent" : "bg-line"}`}
                  aria-hidden="true"
                />
                <span className="text-[0.65rem] text-muted">
                  {dayLabels[i]}
                  <span className="sr-only">: {active ? t("active") : t("inactive")}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="card space-y-3 p-5">
        <div className="flex items-start gap-3">
          <Icon name="target" size={22} className="mt-0.5 shrink-0 text-brand-ink" />
          <div className="flex-1">
            <p className="text-sm font-medium text-muted">{t("weeklyGoal")}</p>
            <p className="text-2xl font-bold">
              {t("goalProgress", { done: Math.min(week, goal), goal })}
            </p>
          </div>
          {!editing && (
            <button
              type="button"
              onClick={() => {
                setDraft(goal);
                setEditing(true);
              }}
              className="text-sm font-semibold text-brand-ink hover:underline"
            >
              {t("change")}
            </button>
          )}
        </div>
        <ProgressBar value={(week / goal) * 100} label={t("goalProgress", { done: week, goal })} color="var(--success)" />
        {editing ? (
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="weekly-goal" className="text-sm">
              {t("goalLabel")}
            </label>
            <input
              id="weekly-goal"
              type="number"
              min={1}
              max={50}
              value={draft}
              onChange={(e) => setDraft(Number(e.target.value))}
              className="field w-24 py-2"
            />
            <button type="button" onClick={() => void save()} className="btn btn-primary">
              {t("save")}
            </button>
          </div>
        ) : (
          <p className="text-xs text-muted">{week >= goal ? t("goalReached") : t("goalLeft", { count: goal - week })}</p>
        )}
      </div>
    </section>
  );
}
