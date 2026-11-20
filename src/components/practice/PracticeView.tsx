"use client";

import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { LoginPrompt } from "@/components/ui/LoginPrompt";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { tr } from "@/lib/content";
import {
  answerPractice,
  getPracticeQueue,
  getPracticeSummary,
  type PracticeAnswer,
  type PracticeItem,
  type PracticeSummary,
} from "@/lib/engagement-client";
import { formatDateTime } from "@/lib/format";
import { routes } from "@/lib/routes";

type Session = { items: PracticeItem[]; index: number; correct: number; mastered: number };

/**
 * Latihan pintar: soal kuis yang pernah salah muncul lagi terjadwal
 * (1 → 2 → 4 → 7 → 14 hari). Benar terus = dikuasai, keluar dari antrean.
 */
export function PracticeView() {
  const t = useTranslations("practice");
  const locale = useLocale();
  const { user, ready } = useAuth();
  const [summary, setSummary] = useState<PracticeSummary | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [choice, setChoice] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<PracticeAnswer | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    getPracticeSummary().then((s) => alive && setSummary(s));
    return () => {
      alive = false;
    };
  }, [user]);

  if (!ready) return null;
  if (!user) return <LoginPrompt message={t("loginRequired")} />;

  const begin = async () => {
    setBusy(true);
    const items = await getPracticeQueue(10).catch(() => []);
    setBusy(false);
    setSession({ items, index: 0, correct: 0, mastered: 0 });
    setChoice(null);
    setFeedback(null);
  };

  const check = async (item: PracticeItem) => {
    if (choice === null || !session) return;
    setBusy(true);
    const r = await answerPractice(item.id, choice);
    setBusy(false);
    if (!r) return;
    setFeedback(r);
    setSession({ ...session, correct: session.correct + (r.correct ? 1 : 0), mastered: session.mastered + (r.mastered ? 1 : 0) });
  };

  const next = () => {
    if (!session) return;
    setSession({ ...session, index: session.index + 1 });
    setChoice(null);
    setFeedback(null);
  };

  // Belum mulai / selesai satu sesi.
  if (!session || session.index >= session.items.length) {
    const done = session && session.items.length > 0;
    return (
      <div className="card mx-auto max-w-2xl space-y-5 p-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand/10 text-brand-ink">
          <Icon name={done ? "check" : "target"} size={28} />
        </span>
        {done ? (
          <>
            <h2 className="text-2xl">{t("sessionDone")}</h2>
            <p className="text-muted">
              {t("sessionScore", { correct: session.correct, total: session.items.length })}
              {session.mastered > 0 && ` ${t("masteredCount", { count: session.mastered })}`}
            </p>
          </>
        ) : summary === null ? (
          <p className="text-muted">{t("loading")}</p>
        ) : summary.due === 0 ? (
          <>
            <h2 className="text-2xl">{t("nothingDue")}</h2>
            <p className="text-muted">
              {summary.tracked === 0
                ? t("nothingTracked")
                : summary.nextDue
                  ? t("nextDue", { date: formatDateTime(summary.nextDue, locale) })
                  : ""}
            </p>
            <Link href={routes.courses} className="btn btn-ghost">
              {t("browse")}
            </Link>
          </>
        ) : (
          <>
            <h2 className="text-2xl">{t("dueCount", { count: summary.due })}</h2>
            <p className="text-muted">{t("intro")}</p>
          </>
        )}
        {(done || (summary && summary.due > 0)) && (
          <button
            type="button"
            onClick={() => {
              void begin();
              void getPracticeSummary().then(setSummary);
            }}
            disabled={busy}
            className="btn btn-primary btn-lg"
          >
            {done ? t("again") : t("start")}
          </button>
        )}
      </div>
    );
  }

  const item = session.items[session.index];
  const labelId = `p-${item.id}`;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <ProgressBar
        value={(session.index / session.items.length) * 100}
        label={t("progress", { current: session.index + 1, total: session.items.length })}
      />
      <p className="text-sm text-muted">
        {t("progress", { current: session.index + 1, total: session.items.length })} · {tr(item.courseTitle, locale)}
      </p>
      <div className="card space-y-4 p-6">
        <h2 id={labelId} className="text-lg">
          {tr(item.prompt, locale)}
        </h2>
        <div role="radiogroup" aria-labelledby={labelId} className="space-y-2">
          {item.options.map((o, oi) => {
            const right = feedback && oi === feedback.answer;
            const wrong = feedback && oi === choice && !feedback.correct;
            return (
              <label
                key={oi}
                className={clsx(
                  "flex items-start gap-3 rounded-xl border p-3.5 transition",
                  feedback ? "cursor-default" : "cursor-pointer hover:border-brand",
                  right ? "border-success bg-success/10" : wrong ? "border-danger bg-danger/10" : choice === oi ? "border-brand bg-brand/10" : "border-line",
                )}
              >
                <input
                  type="radio"
                  name={item.id}
                  checked={choice === oi}
                  disabled={Boolean(feedback)}
                  onChange={() => setChoice(oi)}
                  className="mt-1 accent-[var(--brand)]"
                />
                <span className="flex-1">{tr(o, locale)}</span>
              </label>
            );
          })}
        </div>
        {feedback && (
          <p role="status" className="rounded-xl bg-surface-2 p-3 text-sm">
            <span className={clsx("mr-1 font-semibold", feedback.correct ? "text-success" : "text-danger")}>
              {feedback.mastered ? t("mastered") : feedback.correct ? t("correct") : t("wrong")}
            </span>
            {tr(feedback.explanation, locale)}
          </p>
        )}
        {feedback ? (
          <button type="button" onClick={next} className="btn btn-primary">
            {t("next")}
          </button>
        ) : (
          <button type="button" onClick={() => void check(item)} disabled={choice === null || busy} className="btn btn-primary">
            {t("check")}
          </button>
        )}
      </div>
    </div>
  );
}
