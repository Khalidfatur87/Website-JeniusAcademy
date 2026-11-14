"use client";

import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { tr } from "@/config/courses";
import type { QuizQuestion } from "@/config/quizzes";
import { Link } from "@/i18n/navigation";
import { attemptPercent, gradeQuiz } from "@/lib/quiz";
import { useQuizResults } from "@/lib/quiz-results";
import { routes } from "@/lib/routes";

type Result = { score: number; total: number; saved: boolean };

/** Kuis satu halaman: jawab semua soal → periksa → skor + pembahasan. */
export function QuizRunner({
  slug,
  questions,
}: {
  slug: string;
  questions: QuizQuestion[];
}) {
  const t = useTranslations("quiz");
  const locale = useLocale();
  const { record } = useQuizResults();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Result | null>(null);

  const answered = Object.keys(answers).length;
  const submitted = result !== null;
  const ready = answered === questions.length;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ready || submitted) return;
    const { score, total } = gradeQuiz(questions, answers);
    setResult({ score, total, saved: true });
    const saved = await record(slug, score, total);
    if (!saved) setResult({ score, total, saved: false });
  };

  const retry = () => {
    setAnswers({});
    setResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const percent = result ? attemptPercent(result) : 0;
  const verdict = percent === 100 ? t("great") : percent >= 70 ? t("good") : t("needsReview");

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {result && (
        <div role="status" className="card space-y-4 p-6 ring-2 ring-brand">
          <p className="text-sm font-semibold text-muted">{t("yourScore")}</p>
          <p className="text-4xl font-bold">
            {result.score}
            <span className="text-xl text-muted"> / {result.total}</span>
          </p>
          <ProgressBar value={percent} label={t("scoreLine", { score: result.score, total: result.total })} color="var(--success)" />
          <p>{verdict}</p>
          {!result.saved && <p className="text-sm text-danger">{t("saveFailed")}</p>}
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={retry} className="btn btn-primary">
              {t("retry")}
            </button>
            <Link href={routes.course(slug)} className="btn btn-ghost">
              {t("backToCourse")}
            </Link>
          </div>
        </div>
      )}

      {questions.map((q, i) => {
        const chosen = answers[q.id];
        const labelId = `q-${q.id}-label`;
        return (
          <div key={q.id} className="card space-y-4 p-6">
            <h2 id={labelId} className="text-lg">
              <span className="mr-2 text-muted">{t("question", { number: i + 1 })}.</span>
              {tr(q.prompt, locale)}
            </h2>

            <div role="radiogroup" aria-labelledby={labelId} className="space-y-2">
              {q.options.map((opt, oi) => {
                const isChosen = chosen === oi;
                const isRight = oi === q.answer;
                return (
                  <label
                    key={oi}
                    className={clsx(
                      "flex items-start gap-3 rounded-xl border p-3.5 transition",
                      submitted ? "cursor-default" : "cursor-pointer hover:border-brand",
                      !submitted && isChosen && "border-brand bg-brand/10",
                      !submitted && !isChosen && "border-line",
                      submitted && isRight && "border-success bg-success/10",
                      submitted && isChosen && !isRight && "border-danger bg-danger/10",
                      submitted && !isChosen && !isRight && "border-line opacity-70",
                    )}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={oi}
                      checked={isChosen}
                      disabled={submitted}
                      onChange={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                      className="mt-1 accent-[var(--brand)]"
                    />
                    <span className="flex-1">{tr(opt, locale)}</span>
                    {submitted && isRight && (
                      <Icon name="check" size={18} className="shrink-0 text-success" />
                    )}
                    {submitted && isChosen && !isRight && (
                      <Icon name="x" size={18} className="shrink-0 text-danger" />
                    )}
                  </label>
                );
              })}
            </div>

            {submitted && (
              <p className="rounded-xl bg-surface-2 p-3 text-sm">
                <span
                  className={clsx(
                    "mr-1 font-semibold",
                    chosen === q.answer ? "text-success" : "text-danger",
                  )}
                >
                  {chosen === q.answer ? t("correct") : t("wrong")}.
                </span>
                <span className="font-semibold">{t("explanation")}: </span>
                {tr(q.explanation, locale)}
              </p>
            )}
          </div>
        );
      })}

      {!submitted && (
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={!ready} className="btn btn-primary btn-lg">
            {t("submit")}
          </button>
          <p className="text-sm text-muted" aria-live="polite">
            {t("progress", { answered, total: questions.length })}
          </p>
        </div>
      )}
    </form>
  );
}
