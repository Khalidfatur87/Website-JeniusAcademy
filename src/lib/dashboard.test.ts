import { describe, expect, it } from "vitest";
import type { Course, Level } from "@/lib/content";
import { summarize } from "./dashboard";
import type { Attempt } from "./quiz";

const lesson = (id: string) => ({
  id,
  title: { id: id, en: id },
  minutes: 10,
  youtubeId: "x",
});

const level: Level = {
  id: "sd",
  name: { id: "SD", en: "Elementary" },
  tagline: { id: "", en: "" },
  price: 0,
  subjects: [],
  color: "#22C55E",
};

const course = (slug: string, ids: string[]): Course => ({
  slug,
  levelId: "sd",
  level,
  quizCount: 0,
  title: { id: slug, en: slug },
  summary: { id: "", en: "" },
  teacher: "T",
  lessons: ids.map(lesson),
});

const A = course("a", ["l1", "l2", "l3", "l4"]);
const B = course("b", ["l1", "l2"]);
const C = course("c", ["l1"]);

const attempt = (courseSlug: string, score: number, total: number): Attempt => ({
  courseSlug,
  score,
  total,
  at: "2026-01-01T00:00:00Z",
});

describe("summarize", () => {
  it("tanpa aktivitas: semua nol dan avgQuiz null", () => {
    const s = summarize([A, B], () => [], []);
    expect(s.doneLessons).toBe(0);
    expect(s.totalLessons).toBe(6);
    expect(s.started).toHaveLength(0);
    expect(s.completedCount).toBe(0);
    expect(s.avgQuiz).toBeNull();
  });

  it("menghitung progres, kelas berjalan, dan kelas tuntas", () => {
    const done: Record<string, string[]> = { a: ["l1", "l3"], b: ["l1", "l2"] };
    const s = summarize([A, B, C], (slug) => done[slug] ?? [], []);

    expect(s.doneLessons).toBe(4);
    expect(s.started.map((x) => x.course.slug)).toEqual(["a", "b"]);
    expect(s.inProgress.map((x) => x.course.slug)).toEqual(["a"]);
    expect(s.completedCount).toBe(1);

    const a = s.stats[0];
    expect(a.percent).toBe(50);
    expect(a.next?.id).toBe("l2"); // pelajaran pertama yang belum selesai
    expect(s.stats[1].next).toBeUndefined(); // kelas tuntas
  });

  it("mengabaikan id pelajaran yang sudah tidak ada", () => {
    const s = summarize([C], () => ["l1", "hantu", "l1"], []);
    expect(s.stats[0].done).toBe(1);
    expect(s.stats[0].percent).toBe(100);
  });

  it("rata-rata skor memakai skor terbaik per kelas", () => {
    const s = summarize(
      [A, B],
      () => [],
      [attempt("a", 1, 4), attempt("a", 4, 4), attempt("b", 2, 4)],
    );
    // a terbaik 100%, b 50% → rata-rata 75%
    expect(s.avgQuiz).toBe(75);
    expect(s.stats[0].best?.score).toBe(4);
  });
});
