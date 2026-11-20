/**
 * GAMIFIKASI (fungsi murni): level dari XP dan lencana dari statistik.
 * Aturan XP dihitung di database (fungsi xp_table) — samakan bila diubah:
 */
export const XP_RULES = {
  lesson: 10,
  quizCorrect: 2,
  practiceCorrect: 3,
  certificate: 50,
  tryout: 30,
} as const;

/** XP kumulatif untuk mencapai level n: 50·n·(n−1) → 0, 100, 300, 600, 1000, … */
export const xpForLevel = (level: number) => 50 * level * (level - 1);

export function levelFromXp(xp: number) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level += 1;
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, current: xp - base, needed: next - base, percent: Math.round(((xp - base) / (next - base)) * 100) };
}

export type AchievementStats = {
  xpTotal: number;
  xpWeek: number;
  lessons: number;
  perfectQuizzes: number;
  certificates: number;
  tryouts: number;
  practiceCorrect: number;
  /** Tanggal aktif "YYYY-MM-DD" (WIB). */
  activeDays: string[];
};

/** Rangkaian hari berturut-turut terpanjang. */
export function bestStreak(days: string[]): number {
  const sorted = [...new Set(days)].sort();
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const d of sorted) {
    const t = Date.parse(`${d}T00:00:00Z`);
    run = prev !== null && t - prev === 86_400_000 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }
  return best;
}

export type BadgeId =
  | "firstLesson"
  | "tenLessons"
  | "fiftyLessons"
  | "perfectQuiz"
  | "streak7"
  | "streak30"
  | "firstCertificate"
  | "threeCertificates"
  | "tryoutTaker"
  | "practice50";

export const BADGES: { id: BadgeId; icon: "book" | "sparkles" | "flame" | "award" | "target" | "check"; earned: (s: AchievementStats, streak: number) => boolean }[] = [
  { id: "firstLesson", icon: "book", earned: (s) => s.lessons >= 1 },
  { id: "tenLessons", icon: "book", earned: (s) => s.lessons >= 10 },
  { id: "fiftyLessons", icon: "book", earned: (s) => s.lessons >= 50 },
  { id: "perfectQuiz", icon: "sparkles", earned: (s) => s.perfectQuizzes >= 1 },
  { id: "streak7", icon: "flame", earned: (_, streak) => streak >= 7 },
  { id: "streak30", icon: "flame", earned: (_, streak) => streak >= 30 },
  { id: "firstCertificate", icon: "award", earned: (s) => s.certificates >= 1 },
  { id: "threeCertificates", icon: "award", earned: (s) => s.certificates >= 3 },
  { id: "tryoutTaker", icon: "target", earned: (s) => s.tryouts >= 1 },
  { id: "practice50", icon: "check", earned: (s) => s.practiceCorrect >= 50 },
];

export function badges(stats: AchievementStats) {
  const streak = bestStreak(stats.activeDays);
  return BADGES.map((b) => ({ id: b.id, icon: b.icon, earned: b.earned(stats, streak) }));
}
