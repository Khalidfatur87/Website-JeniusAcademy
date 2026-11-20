"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { getAchievements, getPracticeSummary, type PracticeSummary } from "@/lib/engagement-client";
import { badges, levelFromXp, type AchievementStats } from "@/lib/gamification";
import { routes } from "@/lib/routes";

/** Dasbor: level & XP, lencana, dan soal latihan yang jatuh tempo hari ini. */
export function AchievementsCard() {
  const t = useTranslations("gamification");
  const { user } = useAuth();
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [practice, setPractice] = useState<PracticeSummary | null>(null);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    getAchievements().then((s) => alive && setStats(s));
    getPracticeSummary().then((p) => alive && setPractice(p));
    return () => {
      alive = false;
    };
  }, [user]);

  if (!user || !stats) return null;
  const lvl = levelFromXp(stats.xpTotal);
  const list = badges(stats);
  const earned = list.filter((b) => b.earned).length;

  return (
    <section aria-label={t("label")} className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted">{t("level", { level: lvl.level })}</p>
          <Link href={routes.leaderboard} className="text-sm font-semibold text-brand-ink hover:underline">
            {t("leaderboard")}
          </Link>
        </div>
        <p className="text-3xl font-bold">{t("xp", { xp: stats.xpTotal })}</p>
        <ProgressBar value={lvl.percent} label={t("toNext", { current: lvl.current, needed: lvl.needed })} color="var(--accent)" />
        <p className="text-xs text-muted">
          {t("toNext", { current: lvl.current, needed: lvl.needed })} · {t("thisWeek", { xp: stats.xpWeek })}
        </p>
      </div>

      <div className="card space-y-3 p-5">
        <p className="text-sm font-medium text-muted">{t("practiceTitle")}</p>
        <p className="text-3xl font-bold">{practice?.due ?? 0}</p>
        <p className="text-xs text-muted">{practice?.due ? t("practiceDue") : t("practiceNone")}</p>
        <Link href={routes.practice} className={practice?.due ? "btn btn-primary" : "btn btn-ghost"}>
          <Icon name="target" size={16} />
          {t("practiceGo")}
        </Link>
      </div>

      <div className="card space-y-3 p-5">
        <p className="text-sm font-medium text-muted">{t("badges", { earned, total: list.length })}</p>
        <ul className="grid grid-cols-5 gap-2">
          {list.map((b) => (
            <li key={b.id} title={`${t(`badge.${b.id}.name`)} — ${t(`badge.${b.id}.how`)}`}>
              <span
                className={clsx(
                  "grid aspect-square place-items-center rounded-xl",
                  b.earned ? "bg-accent/15 text-accent" : "bg-surface-2 text-line",
                )}
              >
                <Icon name={b.icon} size={20} />
              </span>
              <span className="sr-only">
                {t(`badge.${b.id}.name`)}: {b.earned ? t("earned") : t(`badge.${b.id}.how`)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
