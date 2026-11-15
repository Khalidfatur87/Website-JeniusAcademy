/** Satu percobaan kuis. `at` berformat ISO. Penilaian dilakukan di server (`submit_quiz`). */
export type Attempt = {
  courseSlug: string;
  score: number;
  total: number;
  at: string;
};

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

/** Syarat sertifikat (sama dengan claim_certificate di database). */
export function certificateStatus(input: {
  doneLessons: number;
  totalLessons: number;
  quizCount: number;
  best?: Pick<Attempt, "score" | "total">;
  minPercent: number;
}): "ready" | "lessons" | "quiz" {
  if (input.totalLessons === 0 || input.doneLessons < input.totalLessons) return "lessons";
  if (input.quizCount > 0) {
    const b = input.best;
    if (!b || b.total === 0 || b.score * 100 < input.minPercent * b.total) return "quiz";
  }
  return "ready";
}
