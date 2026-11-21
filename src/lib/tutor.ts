import type { L10n } from "./content";

/**
 * TUTOR AI — bagian murni (dites): validasi permintaan dan penyusunan prompt.
 * Pemanggilan model AI ada di src/app/api/tutor/route.ts.
 */

export const TUTOR_QUESTION_MAX = 1000;
export const TUTOR_HISTORY_MAX = 8;

export type TutorTurn = { role: "user" | "assistant"; content: string };

export type TutorRequest =
  | {
      mode: "lesson";
      slug: string;
      lessonId: string;
      question: string;
      history: TutorTurn[];
      locale: string;
    }
  | {
      mode: "quiz";
      questionId: string;
      chosen: number | null;
      locale: string;
    };

export type TutorError =
  | "invalid"
  | "notSignedIn"
  | "noAccess"
  | "quota"
  | "notConfigured"
  | "generic";

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const LESSON_RE = /^[a-z0-9-]{1,40}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Memeriksa isi permintaan dari browser; null bila tidak valid. */
export function parseTutorRequest(body: unknown): TutorRequest | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const locale = b.locale === "en" ? "en" : "id";

  if (b.mode === "lesson") {
    const question = typeof b.question === "string" ? b.question.trim() : "";
    if (typeof b.slug !== "string" || !SLUG_RE.test(b.slug)) return null;
    if (typeof b.lessonId !== "string" || !LESSON_RE.test(b.lessonId)) return null;
    if (!question || question.length > TUTOR_QUESTION_MAX) return null;
    const rawHistory = Array.isArray(b.history) ? b.history : [];
    const history: TutorTurn[] = [];
    for (const h of rawHistory.slice(-TUTOR_HISTORY_MAX)) {
      const turn = h as Record<string, unknown>;
      if ((turn.role !== "user" && turn.role !== "assistant") || typeof turn.content !== "string") return null;
      const content = turn.content.trim().slice(0, 4000);
      if (content) history.push({ role: turn.role, content });
    }
    // Riwayat harus dimulai dari pertanyaan siswa dan bergantian.
    while (history.length && history[0].role !== "user") history.shift();
    for (let i = 1; i < history.length; i++) {
      if (history[i].role === history[i - 1].role) return null;
    }
    if (history.length && history[history.length - 1].role !== "assistant") return null;
    return { mode: "lesson", slug: b.slug, lessonId: b.lessonId, question, history, locale };
  }

  if (b.mode === "quiz") {
    if (typeof b.questionId !== "string" || !UUID_RE.test(b.questionId)) return null;
    const chosen = Number.isInteger(b.chosen) && (b.chosen as number) >= 0 && (b.chosen as number) < 10 ? (b.chosen as number) : null;
    return { mode: "quiz", questionId: b.questionId, chosen, locale };
  }
  return null;
}

/** Instruksi tetap (sama untuk semua permintaan → bisa di-cache). */
export const TUTOR_SYSTEM = `You are "Tutor Jenius", a patient tutor on JeniusAcademy, an Indonesian online learning platform for elementary, junior high, senior high school students and UTBK (university entrance exam) candidates.

How to help:
- Explain like a good teacher talking to the student: short sentences, one idea at a time, concrete everyday examples where they help.
- For calculations or reasoning, show the steps in order so the student can follow and redo them alone.
- Base your answer on the lesson material provided. If the question goes beyond it, you may still help briefly with general knowledge, and say that it is outside this lesson.
- If the student asks for something unrelated to learning, or something unsafe, politely steer them back to the lesson.
- When a student is clearly guessing or stuck, end with one short question or hint that lets them try the next step themselves.
- Keep answers focused: usually under 200 words. Write plain text with simple numbered steps when useful; do not use tables, headings or code blocks. Write math inline in plain characters (e.g. 3/4, x², √2).
- Answer in the language given in the request (Indonesian or English).`;

const lang = (locale: string) => (locale === "en" ? "English" : "Bahasa Indonesia");
const pick = (text: Partial<L10n> | null | undefined, locale: string) =>
  (text && (text[locale as keyof L10n] || text.id)) || "";

/** Konteks pelajaran (judul + catatan guru). */
export function lessonContext(input: {
  courseTitle: L10n;
  lessonTitle: L10n;
  notes: L10n | null;
  locale: string;
}): string {
  const notes = pick(input.notes, input.locale).trim();
  return [
    `Answer language: ${lang(input.locale)}.`,
    `Course: ${pick(input.courseTitle, input.locale)}`,
    `Lesson: ${pick(input.lessonTitle, input.locale)}`,
    notes ? `Lesson notes from the teacher:\n<notes>\n${notes}\n</notes>` : "The teacher has not written notes for this lesson; rely on the lesson title.",
  ].join("\n");
}

/** Permintaan penjelasan soal kuis yang dijawab salah / ingin dipahami. */
export function quizPrompt(input: {
  prompt: L10n;
  options: L10n[];
  answer: number;
  explanation: L10n;
  chosen: number | null;
  locale: string;
}): string {
  const letters = "ABCDEF";
  const opts = input.options.map((o, i) => `${letters[i]}. ${pick(o, input.locale)}`).join("\n");
  const chosen =
    input.chosen === null || input.chosen >= input.options.length
      ? "The student did not answer."
      : `The student chose ${letters[input.chosen]}.`;
  const teacher = pick(input.explanation, input.locale).trim();
  return [
    `Answer language: ${lang(input.locale)}.`,
    `Quiz question:\n${pick(input.prompt, input.locale)}`,
    `Options:\n${opts}`,
    `Correct answer: ${letters[input.answer]}.`,
    chosen,
    teacher ? `Teacher's short explanation: ${teacher}` : "",
    input.chosen !== null && input.chosen !== input.answer
      ? "Explain step by step why the correct answer is right, and point out the likely misunderstanding behind the student's choice."
      : "Explain step by step why the correct answer is right.",
  ]
    .filter(Boolean)
    .join("\n\n");
}
