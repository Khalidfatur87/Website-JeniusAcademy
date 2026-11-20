"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { SubscribeCta } from "@/components/course/SubscribeCta";
import { Icon } from "@/components/ui/Icon";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { tr, type Level } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { routes } from "@/lib/routes";
import { totalMinutes, tryoutWindow, type TryoutInfo, type TryoutResult } from "@/lib/tryout";
import { getMyAttempt, getTryoutResult, submitTryout, type AttemptState } from "@/lib/tryout-client";
import { TryoutLeaderboard } from "./TryoutLeaderboard";
import { TryoutResultView } from "./TryoutResultView";

type State =
  | { kind: "loading" }
  | { kind: "guest" }
  | { kind: "fresh" }
  | { kind: "running"; attempt: NonNullable<AttemptState> }
  | { kind: "done"; result: TryoutResult };

/** Info try-out + tombol mulai/lanjut, atau hasil & peringkat bila sudah dikerjakan. */
export function TryoutPanel({ tryout, level }: { tryout: TryoutInfo; level: Level | null }) {
  const t = useTranslations("tryout");
  const locale = useLocale();
  const { user, ready } = useAuth();
  const [state, setState] = useState<State>({ kind: "loading" });
  const window_ = tryoutWindow(tryout);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    (async () => {
      if (!user) return alive && setState({ kind: "guest" });
      const attempt = await getMyAttempt(tryout.slug);
      if (!attempt) return alive && setState({ kind: "fresh" });
      if (!attempt.submittedAt && Date.now() < new Date(attempt.deadline).getTime()) {
        return alive && setState({ kind: "running", attempt });
      }
      // Sudah diserahkan, atau waktu habis tanpa diserahkan → server menilai jawaban tersimpan.
      const result = attempt.submittedAt
        ? await getTryoutResult(tryout.slug)
        : await submitTryout(tryout.slug, {});
      if (alive) setState(result ? { kind: "done", result } : { kind: "fresh" });
    })();
    return () => {
      alive = false;
    };
  }, [ready, user, tryout.slug]);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-8">
        {state.kind === "done" ? (
          <TryoutResultView tryout={tryout} result={state.result} />
        ) : (
          <section aria-labelledby="sections-heading" className="space-y-3">
            <h2 id="sections-heading" className="text-xl">
              {t("sections")}
            </h2>
            <ol className="card divide-y divide-line">
              {tryout.sections.map((s, i) => (
                <li key={s.id} className="flex items-center gap-3 p-4">
                  <span className="grid size-8 place-items-center rounded-full bg-surface-2 text-sm font-bold">{i + 1}</span>
                  <span className="flex-1 font-medium">{tr(s.title, locale)}</span>
                  <span className="text-sm text-muted">{t("minutes", { count: s.minutes })}</span>
                </li>
              ))}
            </ol>
            <ul className="space-y-1.5 text-sm text-muted">
              <li>• {t("rule1")}</li>
              <li>• {t("rule2")}</li>
              <li>• {t("rule3")}</li>
            </ul>
          </section>
        )}
        <TryoutLeaderboard slug={tryout.slug} refreshKey={state.kind === "done" ? 1 : 0} />
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card space-y-4 p-6">
          <p className="flex items-center gap-2 text-sm text-muted">
            <Icon name="clock" size={16} />
            {t("totalTime", { count: totalMinutes(tryout.sections) })}
          </p>
          {(tryout.opensAt || tryout.closesAt) && (
            <p className="text-sm text-muted">
              {tryout.opensAt && t("opensAt", { date: formatDate(tryout.opensAt, locale) })}
              {tryout.opensAt && tryout.closesAt && <br />}
              {tryout.closesAt && t("closesAt", { date: formatDate(tryout.closesAt, locale) })}
            </p>
          )}

          {state.kind === "loading" ? (
            <div className="h-12 animate-pulse rounded-xl bg-surface-2" />
          ) : state.kind === "guest" ? (
            <>
              <p className="text-sm">{t("loginToStart")}</p>
              <Link href={routes.login} className="btn btn-primary w-full">
                {t("login")}
              </Link>
            </>
          ) : state.kind === "running" ? (
            <Link href={routes.tryoutTake(tryout.slug)} className="btn btn-primary btn-lg w-full">
              <Icon name="play" size={16} />
              {t("continue")}
            </Link>
          ) : state.kind === "done" ? (
            <p className="flex items-center gap-2 text-sm font-medium text-success">
              <Icon name="check" size={16} />
              {t("submittedOn", { date: formatDate(state.result.submittedAt, locale) })}
            </p>
          ) : window_ !== "open" ? (
            <p className="text-sm font-medium">{t(`window.${window_}`)}</p>
          ) : (
            <>
              <p className="text-sm text-muted">{t("oneAttempt")}</p>
              <Link href={routes.tryoutTake(tryout.slug)} className="btn btn-primary btn-lg w-full">
                <Icon name="play" size={16} />
                {t("start")}
              </Link>
              {level && level.price > 0 && (
                <div className="space-y-2 border-t border-line pt-4">
                  <p className="text-xs text-muted">{t("needsPlan", { level: tr(level.name, locale) })}</p>
                  <SubscribeCta level={level} compact />
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
