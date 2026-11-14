import { describe, expect, it } from "vitest";
import { tr, type Course, type Level } from "@/lib/content";
import { courseColor, courseMinutes, levelFilterOptions, lessonIds } from "./course-utils";

const level = (id: string, color: string): Level => ({
  id,
  name: { id: `Jenjang ${id}`, en: `Level ${id}` },
  tagline: { id: "", en: "" },
  price: 0,
  subjects: [],
  color,
});

const levels = [level("sd", "#22C55E"), level("smp", "#0085FF")];

const course: Course = {
  slug: "sd-pecahan",
  levelId: "sd",
  level: levels[0],
  title: { id: "Pecahan", en: "Fractions" },
  summary: { id: "", en: "" },
  teacher: "T",
  quizCount: 0,
  lessons: [
    { id: "l1", title: { id: "a", en: "a" }, minutes: 12, youtubeId: "x" },
    { id: "l2", title: { id: "b", en: "b" }, minutes: 15, youtubeId: "x" },
  ],
};

describe("course-utils", () => {
  it("courseMinutes menjumlahkan durasi pelajaran", () => {
    expect(courseMinutes(course)).toBe(27);
  });

  it("lessonIds mengembalikan id sesuai urutan", () => {
    expect(lessonIds(course)).toEqual(["l1", "l2"]);
  });

  it("courseColor mengikuti warna jenjang", () => {
    expect(courseColor(course)).toBe("#22C55E");
  });

  it("levelFilterOptions: 'Semua' di depan, lalu tiap jenjang", () => {
    const opts = levelFilterOptions(levels, "en", "All");
    expect(opts[0]).toEqual({ id: "all", label: "All" });
    expect(opts.slice(1)).toEqual([
      { id: "sd", label: "Level sd" },
      { id: "smp", label: "Level smp" },
    ]);
  });
});

describe("tr (pemilih bahasa)", () => {
  it("memilih bahasa yang diminta", () => {
    expect(tr({ id: "Halo", en: "Hello" }, "en")).toBe("Hello");
    expect(tr({ id: "Halo", en: "Hello" }, "id")).toBe("Halo");
  });

  it("fallback ke bahasa Indonesia untuk bahasa tak dikenal", () => {
    expect(tr({ id: "Halo", en: "Hello" }, "fr")).toBe("Halo");
  });

  it("terjemahan kosong di CMS → pakai bahasa Indonesia", () => {
    expect(tr({ id: "Halo", en: "" }, "en")).toBe("Halo");
  });

  it("aman untuk teks yang hilang", () => {
    expect(tr(undefined, "id")).toBe("");
    expect(tr({ en: "Only English" }, "id")).toBe("Only English");
  });
});
