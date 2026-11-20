import { describe, expect, it } from "vitest";
import { lessonContext, parseTutorRequest, quizPrompt, TUTOR_QUESTION_MAX } from "./tutor";

const t = (id: string, en = "") => ({ id, en });

describe("parseTutorRequest", () => {
  const lesson = { mode: "lesson", slug: "sma-fisika", lessonId: "l3", question: " Apa itu gaya? ", locale: "id" };

  it("menerima pertanyaan pelajaran yang valid (dirapikan)", () => {
    expect(parseTutorRequest(lesson)).toEqual({ ...lesson, question: "Apa itu gaya?", history: [] });
  });

  it("menolak slug/id aneh, pertanyaan kosong atau terlalu panjang", () => {
    expect(parseTutorRequest({ ...lesson, slug: "../x" })).toBeNull();
    expect(parseTutorRequest({ ...lesson, lessonId: "L 3" })).toBeNull();
    expect(parseTutorRequest({ ...lesson, question: "   " })).toBeNull();
    expect(parseTutorRequest({ ...lesson, question: "x".repeat(TUTOR_QUESTION_MAX + 1) })).toBeNull();
    expect(parseTutorRequest(null)).toBeNull();
    expect(parseTutorRequest({ mode: "lain" })).toBeNull();
  });

  it("riwayat harus bergantian dan diakhiri jawaban tutor", () => {
    const ok = [
      { role: "user", content: "a" },
      { role: "assistant", content: "b" },
    ];
    expect(parseTutorRequest({ ...lesson, history: ok })).not.toBeNull();
    expect(parseTutorRequest({ ...lesson, history: [...ok, { role: "user", content: "c" }] })).toBeNull();
    expect(parseTutorRequest({ ...lesson, history: [{ role: "system", content: "x" }] })).toBeNull();
    expect(
      parseTutorRequest({ ...lesson, history: [{ role: "assistant", content: "x" }, ...ok] }),
    ).toMatchObject({ history: ok });
  });

  it("mode kuis butuh id soal UUID; pilihan opsional", () => {
    const id = "2ae47862-2e19-4724-9bee-e5168d5ab839";
    expect(parseTutorRequest({ mode: "quiz", questionId: id, chosen: 2, locale: "en" })).toEqual({
      mode: "quiz",
      questionId: id,
      chosen: 2,
      locale: "en",
    });
    expect(parseTutorRequest({ mode: "quiz", questionId: id, chosen: "x" })).toMatchObject({ chosen: null, locale: "id" });
    expect(parseTutorRequest({ mode: "quiz", questionId: "123" })).toBeNull();
  });
});

describe("prompt", () => {
  it("konteks pelajaran memuat judul dan catatan sesuai bahasa", () => {
    const c = lessonContext({
      courseTitle: t("Fisika", "Physics"),
      lessonTitle: t("Hukum Newton", "Newton's laws"),
      notes: t("F = m × a", ""),
      locale: "en",
    });
    expect(c).toContain("English");
    expect(c).toContain("Physics");
    expect(c).toContain("F = m × a"); // catatan EN kosong → pakai versi Indonesia
  });

  it("prompt kuis menyebut kunci dan pilihan siswa", () => {
    const p = quizPrompt({
      prompt: t("1/2 × 1/3"),
      options: [t("1/6"), t("2/5")],
      answer: 0,
      explanation: t("kalikan pembilang dan penyebut"),
      chosen: 1,
      locale: "id",
    });
    expect(p).toContain("Correct answer: A.");
    expect(p).toContain("The student chose B.");
    expect(p).toContain("misunderstanding");
  });
});
