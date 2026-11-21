import { describe, expect, it } from "vitest";
import shared from "../../shared/fixtures/gamification.json";
import { badges, bestStreak, levelFromXp, xpForLevel, type AchievementStats } from "./gamification";

describe("level", () => {
  it("ambang XP bertambah tiap level", () => {
    expect([1, 2, 3, 4, 5].map(xpForLevel)).toEqual([0, 100, 300, 600, 1000]);
  });
  it("level & progres", () => {
    expect(levelFromXp(0)).toEqual({ level: 1, current: 0, needed: 100, percent: 0 });
    expect(levelFromXp(99).level).toBe(1);
    expect(levelFromXp(100)).toEqual({ level: 2, current: 0, needed: 200, percent: 0 });
    expect(levelFromXp(450)).toEqual({ level: 3, current: 150, needed: 300, percent: 50 });
  });
});

describe("bestStreak", () => {
  it("rangkaian terpanjang, tanggal ganda diabaikan", () => {
    expect(bestStreak([])).toBe(0);
    expect(bestStreak(["2026-11-01", "2026-11-02", "2026-11-02", "2026-11-04", "2026-11-05", "2026-11-06"])).toBe(3);
    expect(bestStreak(["2026-12-31", "2027-01-01"])).toBe(2);
  });
});

describe("badges", () => {
  const empty: AchievementStats = {
    xpTotal: 0,
    xpWeek: 0,
    lessons: 0,
    perfectQuizzes: 0,
    certificates: 0,
    tryouts: 0,
    practiceCorrect: 0,
    activeDays: [],
  };
  const earned = (s: AchievementStats) => badges(s).filter((b) => b.earned).map((b) => b.id);

  it("belum ada lencana untuk akun baru", () => {
    expect(earned(empty)).toEqual([]);
  });

  it("lencana sesuai statistik", () => {
    const days = Array.from({ length: 7 }, (_, i) => `2026-11-0${i + 1}`);
    expect(earned({ ...empty, lessons: 12, perfectQuizzes: 1, activeDays: days, tryouts: 1 })).toEqual([
      "firstLesson",
      "tenLessons",
      "perfectQuiz",
      "streak7",
      "tryoutTaker",
    ]);
  });
});

// Kasus uji bersama dengan aplikasi mobile (mobile/test/domain/gamification_test.dart).

describe("kasus uji bersama (shared/fixtures/gamification.json)", () => {
  const empty: AchievementStats = {
    xpTotal: 0,
    xpWeek: 0,
    lessons: 0,
    perfectQuizzes: 0,
    certificates: 0,
    tryouts: 0,
    practiceCorrect: 0,
    activeDays: [],
  };

  it.each(shared.xpForLevel)("xpForLevel($level) = $xp", ({ level, xp }) => {
    expect(xpForLevel(level)).toBe(xp);
  });
  it.each(shared.levelFromXp)("levelFromXp($xp)", ({ xp, expected }) => {
    expect(levelFromXp(xp)).toEqual(expected);
  });
  it.each(shared.bestStreak)("bestStreak #%#", ({ days, expected }) => {
    expect(bestStreak(days)).toBe(expected);
  });
  it.each(shared.badges)("badges #%#", ({ stats, expected }) => {
    const got = badges({ ...empty, ...stats }).filter((b) => b.earned).map((b) => b.id);
    expect(got).toEqual(expected);
  });
});
