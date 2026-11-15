"use client";

import clsx from "clsx";
import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { LockedLesson } from "@/components/course/LockedLesson";
import { useAuth } from "@/lib/auth";
import { tr, type Course, type QuizQuestion, type QuizResult } from "@/lib/content";
import { Link } from "@/i18n/navigation";
import { attemptPercent } from "@/lib/quiz";
import { useQuizResults, type SubmitError } from "@/lib/quiz-results";
import { routes } from "@/lib/routes";
import { useCourseAccess } from "@/lib/use-access";

/**
 * Kuis satu halaman: jawab semua soal → dinilai server → skor + kunci & pembahasan.
 * Kunci jawaban baru dikirim setelah jawaban diserahkan.
 */
export function QuizRunner({ course, questions }: { course: Course; questions: QuizQuestion[] }) {
  const t = useTranslations("quiz");
  const locale = useLocale();
  const slug = course.slug;
  const { user } = useAuth();
  const { access, loaded } = useCourseAccess(course);
  const { submit: send } = useQuizResults();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<SubmitError | null>(null);

  const answered = Object.keys(answers).length;
  const submitted = result !== null;
  const ready = answered === questions.length;
  const key = new Map(result?.results.map((r) => [r.id, r]) ?? []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ready || submitted || busy) return;
    setBusy(true);
    setError(null);
    const r = await send(slug, answers).catch(() => ({ error: "generic" as const }));
    setBusy(false);
    if ("error" in r) return setError(r.error);
    setResult(r.result);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const retry = () => {
    setAnswers({});
    setResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if ((loaded && !access) || error === "noAccess") {
    return <LockedLesson course={course} currentId="" inline />;
  }

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
          {!result.recorded && <p className="text-sm text-muted">{user ? t("saveFailed") : t("guestNotSaved")}</p>}
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
        const graded = key.get(q.id);
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
                const isRight = oi === graded?.answer;
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

            {graded && (
              <p className="rounded-xl bg-surface-2 p-3 text-sm">
                <span
                  className={clsx(
                    "mr-1 font-semibold",
                    chosen === graded.answer ? "text-success" : "text-danger",
                  )}
                >
                  {chosen === graded.answer ? t("correct") : t("wrong")}.
                </span>
                {tr(graded.explanation, locale) && (
                  <>
                    <span className="font-semibold">{t("explanation")}: </span>
                    {tr(graded.explanation, locale)}
                  </>
                )}
              </p>
            )}
          </div>
        );
      })}

      {!submitted && (
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={!ready || busy} className="btn btn-primary btn-lg">
            {busy ? t("checking") : t("submit")}
          </button>
          <p className="text-sm text-muted" aria-live="polite">
            {t("progress", { answered, total: questions.length })}
          </p>
          {error === "generic" && (
            <p role="alert" className="w-full text-sm text-danger">
              {t("submitFailed")}
            </p>
          )}
        </div>
      )}
    </form>
  );
}
