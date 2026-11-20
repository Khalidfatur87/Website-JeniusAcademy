"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { LoginPrompt } from "@/components/ui/LoginPrompt";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { siteConfig } from "@/config/site";
import { currentStreak, weekDays } from "@/lib/activity";
import { avatarUrl, useAuth } from "@/lib/auth";
import { tr } from "@/lib/content";
import { getChildren, redeemParentCode, unlinkParent, type ChildSummary, type RedeemError } from "@/lib/engagement-client";
import { formatDate } from "@/lib/format";

/** Hari aktif "YYYY-MM-DD" (WIB) → waktu tengah hari, untuk fungsi streak. */
const dayTimes = (days: string[]) => days.map((d) => `${d}T12:00:00`);

function ChildCard({ child, onUnlinked }: { child: ChildSummary; onUnlinked: () => void }) {
  const t = useTranslations("parent");
  const s = useTranslations("streak");
  const locale = useLocale();
  const { user } = useAuth();
  const times = dayTimes(child.activeDays);
  const streak = currentStreak(times);
  const days = weekDays(times);
  const labels = s("days").split(",");

  const share = () => {
    const text = t("shareText", {
      name: child.name,
      lessons: child.lessonsWeek,
      quizzes: child.quizzesWeek,
      streak,
      site: siteConfig.name,
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  const unlink = async () => {
    if (!user || !window.confirm(t("confirmUnlink", { name: child.name }))) return;
    if (await unlinkParent(user.id, child.studentId)) onUnlinked();
  };

  return (
    <li className="card space-y-5 p-6">
      <div className="flex items-center gap-3">
        <Avatar name={child.name} src={avatarUrl(child.avatarPath)} size="size-10" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg">{child.name}</h2>
          <p className="text-xs text-muted">
            {child.lastActive ? t("lastActive", { date: formatDate(child.lastActive, locale) }) : t("neverActive")}
          </p>
        </div>
        <button type="button" onClick={share} className="btn btn-ghost" title={t("share")}>
          <Icon name="whatsapp" size={16} />
          <span className="hidden sm:inline">{t("share")}</span>
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [t("streak"), s("days_count", { count: streak })],
          [t("lessonsWeek"), child.lessonsWeek],
          [t("quizzesWeek"), child.quizzesWeek],
          [t("avgQuiz"), child.avgQuizPercent === null ? "–" : `${child.avgQuizPercent}%`],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-xl bg-surface-2 p-3">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="text-xl font-bold">{value}</dd>
          </div>
        ))}
      </dl>

      <ol className="flex gap-2" aria-label={s("thisWeek")}>
        {days.map((active, i) => (
          <li key={i} className="flex flex-col items-center gap-1">
            <span className={`size-4 rounded-full ${active ? "bg-warning" : "bg-line"}`} aria-hidden="true" />
            <span className="text-[0.7rem] text-muted">
              {labels[i]}
              <span className="sr-only">: {active ? s("active") : s("inactive")}</span>
            </span>
          </li>
        ))}
      </ol>

      {child.courses.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">{t("courses")}</h3>
          <ul className="space-y-3">
            {child.courses.map((c) => (
              <li key={c.slug} className="space-y-1">
                <p className="flex justify-between gap-2 text-sm">
                  <span className="truncate">{tr(c.title, locale)}</span>
                  <span className="shrink-0 text-muted">
                    {c.done}/{c.total}
                  </span>
                </p>
                <ProgressBar value={c.total ? (c.done / c.total) * 100 : 0} label={`${tr(c.title, locale)}: ${c.done}/${c.total}`} />
              </li>
            ))}
          </ul>
        </div>
      )}

      <button type="button" onClick={() => void unlink()} className="text-xs font-semibold text-muted hover:text-danger">
        {t("unlink")}
      </button>
    </li>
  );
}

/** Dasbor orang tua: tautkan anak dengan kode, lalu pantau ringkasan belajarnya. */
export function ParentView() {
  const t = useTranslations("parent");
  const { user, ready } = useAuth();
  const [children, setChildren] = useState<ChildSummary[] | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: string } | { error: RedeemError } | null>(null);

  const reload = useCallback(() => {
    getChildren().then(setChildren).catch(() => setChildren([]));
  }, []);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    getChildren()
      .then((c) => alive && setChildren(c))
      .catch(() => alive && setChildren([]));
    return () => {
      alive = false;
    };
  }, [user]);

  if (!ready) return null;
  if (!user) return <LoginPrompt message={t("loginRequired")} />;

  const redeem = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await redeemParentCode(code);
    setBusy(false);
    setMsg("error" in r ? { error: r.error } : { ok: r.name });
    if (!("error" in r)) {
      setCode("");
      reload();
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={redeem} className="card flex flex-col gap-3 p-6 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="parent-code" className="mb-1.5 block text-sm font-medium">
            {t("codeLabel")}
          </label>
          <input
            id="parent-code"
            className="field font-mono uppercase tracking-widest"
            value={code}
            maxLength={8}
            placeholder="AB12CD34"
            autoComplete="off"
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <p className="mt-1 text-xs text-muted">{t("codeHint")}</p>
        </div>
        <button type="submit" disabled={busy || code.trim().length !== 8} className="btn btn-primary">
          {t("link")}
        </button>
      </form>
      {msg && (
        <p role={"error" in msg ? "alert" : "status"} className={"error" in msg ? "text-sm text-danger" : "text-sm text-success"}>
          {"error" in msg ? t(`errors.${msg.error}`) : t("linked", { name: msg.ok })}
        </p>
      )}

      {children === null ? null : children.length === 0 ? (
        <p className="card p-8 text-center text-muted">{t("empty")}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {children.map((c) => (
            <ChildCard key={c.studentId} child={c} onUnlinked={reload} />
          ))}
        </ul>
      )}
      <p className="text-xs text-muted">{t("emailNote")}</p>
    </div>
  );
}
