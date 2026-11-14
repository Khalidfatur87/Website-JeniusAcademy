import type { QuizQuestion } from "@/config/quizzes";

/** Satu percobaan kuis. `at` berformat ISO. */
export type Attempt = {
  courseSlug: string;
  score: number;
  total: number;
  at: string;
};

/** Menilai jawaban: `answers` memetakan id soal → indeks opsi yang dipilih. */
export function gradeQuiz(questions: QuizQuestion[], answers: Record<string, number>) {
  const score = questions.filter((q) => answers[q.id] === q.answer).length;
  return { score, total: questions.length };
}

const ratio = (a: Pick<Attempt, "score" | "total">) => (a.total > 0 ? a.score / a.total : 0);

/** Persentase 0–100 (dibulatkan). */
export const attemptPercent = (a: Pick<Attempt, "score" | "total">) => Math.round(ratio(a) * 100);

/** Percobaan terbaik untuk satu kelas (skor tertinggi; seri → yang terbaru). */
export function bestAttempt(attempts: Attempt[], courseSlug: string): Attempt | undefined {
  let best: Attempt | undefined;
  for (const a of attempts) {
    if (a.courseSlug !== courseSlug) continue;
    if (!best || ratio(a) > ratio(best) || (ratio(a) === ratio(best) && a.at > best.at)) {
      best = a;
    }
  }
  return best;
}
