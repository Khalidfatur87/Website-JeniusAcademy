"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { FilterPills } from "@/components/ui/FilterPills";
import { LoginPrompt } from "@/components/ui/LoginPrompt";
import { Link } from "@/i18n/navigation";
import { avatarUrl, useAuth } from "@/lib/auth";
import { tr, type Level } from "@/lib/content";
import { getXpLeaderboard, type XpRow } from "@/lib/engagement-client";
import { routes } from "@/lib/routes";

/** Papan peringkat XP: minggu ini / sepanjang waktu, semua jenjang atau per jenjang. */
export function LeaderboardView({ levels }: { levels: Level[] }) {
  const t = useTranslations("leaderboard");
  const locale = useLocale();
  const { user, ready } = useAuth();
  const [period, setPeriod] = useState<"week" | "all">("week");
  const [level, setLevel] = useState("all");
  const [rows, setRows] = useState<XpRow[] | null>(null);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    getXpLeaderboard(period, level === "all" ? null : level).then((r) => alive && setRows(r));
    return () => {
      alive = false;
    };
  }, [user, period, level]);

  if (!ready) return null;
  if (!user) return <LoginPrompt message={t("loginRequired")} />;

  const medal = ["🥇", "🥈", "🥉"];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FilterPills
          label={t("period")}
          value={period}
          onChange={setPeriod}
          options={[
            { id: "week", label: t("week") },
            { id: "all", label: t("allTime") },
          ]}
        />
        <FilterPills
          label={t("level")}
          value={level}
          onChange={setLevel}
          options={[{ id: "all", label: t("allLevels") }, ...levels.map((l) => ({ id: l.id, label: tr(l.name, locale) }))]}
        />
      </div>
      {rows === null ? null : rows.length === 0 ? (
        <p className="card p-8 text-center text-muted">{t("empty")}</p>
      ) : (
        <ol className="card divide-y divide-line">
          {rows.map((r, i) => (
            <li key={i} className={`flex items-center gap-3 p-4 ${r.isMe ? "bg-brand/10" : ""}`}>
              <span className="w-8 text-center font-bold" aria-label={t("rank", { rank: r.rank })}>
                {r.rank <= 3 ? medal[r.rank - 1] : r.rank}
              </span>
              <Avatar name={r.name} src={avatarUrl(r.avatarPath)} size="size-9" />
              <span className="min-w-0 flex-1 truncate font-medium">
                {r.name}
                {r.isMe && <span className="ml-2 text-xs font-normal text-muted">({t("you")})</span>}
              </span>
              <span className="font-bold text-brand-ink">{t("xp", { xp: r.xp })}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="text-xs text-muted">
        {t("howToEarn")}{" "}
        <Link href={routes.profile} className="font-semibold text-brand-ink hover:underline">
          {t("privacy")}
        </Link>
      </p>
    </div>
  );
}
