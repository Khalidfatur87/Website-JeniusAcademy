import { describe, expect, it } from "vitest";
import { courses } from "@/config/courses";
import { quizzes, type QuizQuestion } from "@/config/quizzes";
import { locales } from "@/config/site";
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

describe("integritas bank soal", () => {
  it("setiap kuis mengacu ke kelas yang ada", () => {
    const slugs = new Set(courses.map((c) => c.slug));
    for (const slug of Object.keys(quizzes)) expect(slugs.has(slug), slug).toBe(true);
  });

  it("soal valid: id unik, indeks jawaban dalam jangkauan, teks lengkap di semua bahasa", () => {
    for (const [slug, list] of Object.entries(quizzes)) {
      expect(list.length, slug).toBeGreaterThan(0);
      expect(new Set(list.map((q) => q.id)).size, `${slug}: id soal unik`).toBe(list.length);

      for (const q of list) {
        const where = `${slug}/${q.id}`;
        expect(q.options.length, `${where}: minimal 2 opsi`).toBeGreaterThanOrEqual(2);
        expect(Number.isInteger(q.answer), where).toBe(true);
        expect(q.answer, where).toBeGreaterThanOrEqual(0);
        expect(q.answer, where).toBeLessThan(q.options.length);

        for (const text of [q.prompt, q.explanation, ...q.options]) {
          for (const l of locales) expect(text[l]?.trim(), `${where} [${l}]`).toBeTruthy();
        }
        // Opsi tidak boleh kembar dalam satu bahasa (jawaban jadi ambigu).
        for (const l of locales) {
          const texts = q.options.map((o) => o[l]);
          expect(new Set(texts).size, `${where} [${l}]: opsi kembar`).toBe(texts.length);
        }
      }
    }
  });
});
