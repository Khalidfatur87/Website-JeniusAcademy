"use client";

import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { tr } from "@/lib/content";
import { attemptPercent } from "@/lib/quiz";
import { weakestSections, type TryoutInfo, type TryoutResult } from "@/lib/tryout";

/** Skor, peringkat, per subtes (dibanding rata-rata peserta), saran, dan pembahasan. */
export function TryoutResultView({ tryout, result }: { tryout: TryoutInfo; result: TryoutResult }) {
  const t = useTranslations("tryout");
  const locale = useLocale();
  const percent = attemptPercent(result);
  const sectionTitle = (id: string) => tr(tryout.sections.find((s) => s.id === id)?.title, locale);
  const weak = weakestSections(result.sectionScores);

  return (
    <div className="space-y-8">
      <section className="card grid grid-cols-1 gap-6 p-6 sm:grid-cols-3" aria-label={t("yourResult")}>
        <div>
          <p className="text-sm font-medium text-muted">{t("yourScore")}</p>
          <p className="text-4xl font-bold">
            {result.score}
            <span className="text-xl text-muted">/{result.total}</span>
          </p>
          <p className="text-sm text-muted">{percent}%</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted">{t("rank")}</p>
          <p className="text-4xl font-bold">
            #{result.rank}
            <span className="text-xl text-muted"> / {result.participants}</span>
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted">{t("focus")}</p>
          {weak.length && weak[0].percent < 100 ? (
            <ul className="mt-1 space-y-1 text-sm">
              {weak.map((w) => (
                <li key={w.id} className="flex items-center gap-2">
                  <Icon name="target" size={16} className="shrink-0 text-warning" />
                  {sectionTitle(w.id)} ({w.percent}%)
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm">{t("allGood")}</p>
          )}
        </div>
      </section>

      <section aria-labelledby="per-section" className="space-y-3">
        <h2 id="per-section" className="text-xl">
          {t("perSection")}
        </h2>
        <ul className="card space-y-4 p-5">
          {result.sectionScores.map((s) => {
            const mine = s.total ? Math.round((s.score / s.total) * 100) : 0;
            const avg = result.sectionAvg[s.id];
            return (
              <li key={s.id} className="space-y-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">{sectionTitle(s.id)}</span>
                  <span className="text-muted">
                    {s.score}/{s.total} ({mine}%)
                    {avg !== undefined && ` · ${t("average", { percent: avg })}`}
                  </span>
                </div>
                <ProgressBar value={mine} label={`${sectionTitle(s.id)}: ${mine}%`} color="var(--brand)" />
                {avg !== undefined && (
                  <div className="h-1 w-full rounded-full bg-line" aria-hidden="true">
                    <div className="h-full rounded-full bg-accent/70" style={{ width: `${avg}%` }} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-muted">{t("legend")}</p>
      </section>

      <section aria-labelledby="review" className="space-y-3">
        <h2 id="review" className="text-xl">
          {t("review")}
        </h2>
        {tryout.sections.map((sec) => {
          const qs = result.key.filter((k) => k.sectionId === sec.id);
          return (
            <details key={sec.id} className="card p-5">
              <summary className="cursor-pointer font-semibold">
                {tr(sec.title, locale)} ({qs.length})
              </summary>
              <ol className="mt-4 space-y-5">
                {qs.map((q, i) => {
                  const chosen = result.answers[q.id];
                  const right = chosen === q.answer;
                  return (
                    <li key={q.id} className="space-y-2">
                      <p className="font-medium">
                        <span className="mr-1 text-muted">{i + 1}.</span>
                        {tr(q.prompt, locale)}
                      </p>
                      <ul className="space-y-1 text-sm">
                        {q.options.map((o, oi) => (
                          <li
                            key={oi}
                            className={clsx(
                              "flex items-start gap-2 rounded-lg border px-3 py-2",
                              oi === q.answer
                                ? "border-success bg-success/10"
                                : oi === chosen
                                  ? "border-danger bg-danger/10"
                                  : "border-line",
                            )}
                          >
                            <span className="flex-1">{tr(o, locale)}</span>
                            {oi === q.answer && <Icon name="check" size={16} className="text-success" />}
                            {oi === chosen && oi !== q.answer && <Icon name="x" size={16} className="text-danger" />}
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm">
                        <span className={clsx("font-semibold", right ? "text-success" : "text-danger")}>
                          {chosen === undefined ? t("unanswered") : right ? t("correct") : t("wrong")}.
                        </span>{" "}
                        {tr(q.explanation, locale)}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </details>
          );
        })}
      </section>
    </div>
  );
}
