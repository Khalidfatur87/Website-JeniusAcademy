import { describe, expect, it } from "vitest";
import type { QuizQuestion } from "@/lib/content";
import { attemptPercent, bestAttempt, gradeQuiz, type Attempt } from "./quiz";

const qs: QuizQuestion[] = [
  { id: "a", prompt: { id: "", en: "" }, options: [], answer: 1, explanation: { id: "", en: "" } },
  { id: "b", prompt: { id: "", en: "" }, options: [], answer: 0, explanation: { id: "", en: "" } },
  { id: "c", prompt: { id: "", en: "" }, options: [], answer: 2, explanation: { id: "", en: "" } },
];

describe("gradeQuiz", () => {
  it("menghitung jawaban benar", () => {
    expect(gradeQuiz(qs, { a: 1, b: 0, c: 2 })).toEqual({ score: 3, total: 3 });
    expect(gradeQuiz(qs, { a: 1, b: 1, c: 0 })).toEqual({ score: 1, total: 3 });
  });

  it("soal tak terjawab dihitung salah", () => {
    expect(gradeQuiz(qs, { a: 1 })).toEqual({ score: 1, total: 3 });
    expect(gradeQuiz(qs, {})).toEqual({ score: 0, total: 3 });
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
