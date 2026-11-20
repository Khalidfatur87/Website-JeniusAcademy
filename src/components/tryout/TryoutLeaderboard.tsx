"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { avatarUrl, useAuth } from "@/lib/auth";
import { getTryoutLeaderboard, type LeaderRow } from "@/lib/tryout-client";

/** 100 peserta teratas; nama disembunyikan untuk yang memilih tidak tampil di papan peringkat. */
export function TryoutLeaderboard({ slug, refreshKey = 0 }: { slug: string; refreshKey?: number }) {
  const t = useTranslations("tryout");
  const { ready, user } = useAuth();
  const [rows, setRows] = useState<LeaderRow[] | null>(null);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    getTryoutLeaderboard(slug).then((r) => alive && setRows(r));
    return () => {
      alive = false;
    };
  }, [ready, slug, user?.id, refreshKey]);

  return (
    <section aria-labelledby="leaderboard-heading" className="space-y-3">
      <h2 id="leaderboard-heading" className="text-xl">
        {t("leaderboard")}
      </h2>
      {!rows ? null : rows.length === 0 ? (
        <p className="card p-6 text-center text-sm text-muted">{t("leaderboardEmpty")}</p>
      ) : (
        <ol className="card divide-y divide-line">
          {rows.map((r, i) => (
            <li key={i} className={`flex items-center gap-3 p-3 ${r.isMe ? "bg-brand/10" : ""}`}>
              <span className="w-8 text-center text-sm font-bold text-muted">{r.rank}</span>
              <Avatar name={r.name ?? "?"} src={avatarUrl(r.avatarPath)} size="size-8" />
              <span className="min-w-0 flex-1 truncate font-medium">
                {r.name ?? t("hiddenName")}
                {r.isMe && <span className="ml-2 text-xs font-normal text-muted">({t("you")})</span>}
              </span>
              <span className="font-semibold">
                {r.score}
                <span className="text-sm font-normal text-muted">/{r.total}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
