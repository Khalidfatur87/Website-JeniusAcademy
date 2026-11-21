import { describe, expect, it } from "vitest";
import shared from "../../shared/fixtures/quiz.json";
import { attemptPercent, bestAttempt, certificateStatus, type Attempt } from "./quiz";

describe("certificateStatus", () => {
  const base = { doneLessons: 4, totalLessons: 4, quizCount: 4, minPercent: 70 };

  it("butuh semua pelajaran selesai", () => {
    expect(certificateStatus({ ...base, doneLessons: 3, best: { score: 4, total: 4 } })).toBe("lessons");
    expect(certificateStatus({ ...base, doneLessons: 0, totalLessons: 0 })).toBe("lessons");
  });

  it("butuh skor kuis minimal batas", () => {
    expect(certificateStatus(base)).toBe("quiz");
    expect(certificateStatus({ ...base, best: { score: 2, total: 4 } })).toBe("quiz");
    expect(certificateStatus({ ...base, best: { score: 7, total: 10 } })).toBe("ready");
    expect(certificateStatus({ ...base, best: { score: 3, total: 4 } })).toBe("ready");
  });

  it("kelas tanpa kuis cukup menyelesaikan pelajaran", () => {
    expect(certificateStatus({ ...base, quizCount: 0 })).toBe("ready");
  });
});

describe("attemptPercent & bestAttempt", () => {
  const at = (courseSlug: string, score: number, total: number, when: string): Attempt => ({
    courseSlug,
    score,
    total,
    at: when,
  });

  it("persentase dibulatkan, aman untuk total 0", () => {
    expect(attemptPercent({ score: 1, total: 3 })).toBe(33);
    expect(attemptPercent({ score: 4, total: 4 })).toBe(100);
    expect(attemptPercent({ score: 0, total: 0 })).toBe(0);
  });

  it("memilih skor tertinggi untuk kelas yang diminta", () => {
    const list = [
      at("x", 2, 4, "2026-01-01"),
      at("x", 4, 4, "2026-01-02"),
      at("x", 3, 4, "2026-01-03"),
      at("y", 4, 4, "2026-01-04"),
    ];
    expect(bestAttempt(list, "x")).toEqual(list[1]);
    expect(bestAttempt(list, "z")).toBeUndefined();
  });

  it("seri: ambil yang terbaru", () => {
    const list = [at("x", 3, 4, "2026-01-01"), at("x", 3, 4, "2026-02-01")];
    expect(bestAttempt(list, "x")).toEqual(list[1]);
  });

  it("membandingkan rasio, bukan skor mentah", () => {
    const list = [at("x", 3, 3, "2026-01-01"), at("x", 4, 5, "2026-01-02")];
    expect(bestAttempt(list, "x")).toEqual(list[0]);
  });
});

// Kasus uji bersama dengan aplikasi mobile (mobile/test/domain/quiz_test.dart).
describe("kasus uji bersama (shared/fixtures/quiz.json)", () => {
  it.each(shared.attemptPercent)("attemptPercent($score/$total)", ({ score, total, expected }) => {
    expect(attemptPercent({ score, total })).toBe(expected);
  });
  it.each(shared.bestAttempt)("bestAttempt #%#", ({ attempts, slug, expectedIndex }) => {
    const got = bestAttempt(attempts, slug);
    expect(got).toEqual(expectedIndex === null ? undefined : attempts[expectedIndex]);
  });
  it.each(shared.certificateStatus)("certificateStatus #%#", ({ input, expected }) => {
    expect(certificateStatus(input)).toBe(expected);
  });
});
