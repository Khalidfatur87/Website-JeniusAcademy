import type { Course, Lesson } from "@/config/courses";
import { attemptPercent, bestAttempt, type Attempt } from "./quiz";

export type CourseStat = {
  course: Course;
  done: number;
  total: number;
  /** 0–100 */
  percent: number;
  /** Pelajaran pertama yang belum selesai (undefined jika kelas tuntas). */
  next?: Lesson;
  best?: Attempt;
};

/**
 * Ringkasan dasbor dari data kelas + progres + riwayat kuis (fungsi murni).
 * Id pelajaran yang sudah tidak ada di kelas diabaikan.
 */
export function summarize(
  courses: Course[],
  doneIds: (slug: string) => string[],
  attempts: Attempt[],
) {
  const stats: CourseStat[] = courses.map((course) => {
    const valid = new Set(course.lessons.map((l) => l.id));
    const done = new Set(doneIds(course.slug).filter((id) => valid.has(id)));
    const total = course.lessons.length;
    return {
      course,
      done: done.size,
      total,
      percent: total ? Math.round((done.size / total) * 100) : 0,
      next: course.lessons.find((l) => !done.has(l.id)),
      best: bestAttempt(attempts, course.slug),
    };
  });

  const started = stats.filter((s) => s.done > 0);
  const bestScores = stats.flatMap((s) => (s.best ? [attemptPercent(s.best)] : []));

  return {
    stats,
    started,
    inProgress: started.filter((s) => s.done < s.total),
    completedCount: started.filter((s) => s.done === s.total).length,
    doneLessons: stats.reduce((sum, s) => sum + s.done, 0),
    totalLessons: stats.reduce((sum, s) => sum + s.total, 0),
    /** Rata-rata skor terbaik per kelas (0–100), null jika belum ada kuis. */
    avgQuiz: bestScores.length
      ? Math.round(bestScores.reduce((a, b) => a + b, 0) / bestScores.length)
      : null,
  };
}
