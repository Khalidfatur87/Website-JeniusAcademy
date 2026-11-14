import { describe, expect, it } from "vitest";
import { courses, getCourse, levels, tr } from "@/config/courses";
import { courseColor, courseMinutes, levelFilterOptions, lessonIds } from "./course-utils";

describe("course-utils", () => {
  const course = courses[0];

  it("courseMinutes menjumlahkan durasi pelajaran", () => {
    expect(courseMinutes(course)).toBe(course.lessons.reduce((s, l) => s + l.minutes, 0));
    expect(courseMinutes(course)).toBeGreaterThan(0);
  });

  it("lessonIds mengembalikan id sesuai urutan", () => {
    expect(lessonIds(course)).toEqual(course.lessons.map((l) => l.id));
  });

  it("courseColor mengikuti warna jenjang", () => {
    const level = levels.find((l) => l.id === course.levelId)!;
    expect(courseColor(course)).toBe(level.color);
  });

  it("levelFilterOptions: 'Semua' di depan, lalu tiap jenjang", () => {
    const opts = levelFilterOptions("id", "Semua");
    expect(opts[0]).toEqual({ id: "all", label: "Semua" });
    expect(opts.map((o) => o.id)).toEqual(["all", ...levels.map((l) => l.id)]);
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
});

describe("integritas data kelas", () => {
  it("slug kelas unik dan getCourse menemukannya", () => {
    const slugs = courses.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const c of courses) expect(getCourse(c.slug)).toBe(c);
  });

  it("id pelajaran unik per kelas dan durasi positif", () => {
    for (const c of courses) {
      const ids = c.lessons.map((l) => l.id);
      expect(new Set(ids).size, c.slug).toBe(ids.length);
      expect(c.lessons.length, c.slug).toBeGreaterThan(0);
      for (const l of c.lessons) expect(l.minutes, `${c.slug}/${l.id}`).toBeGreaterThan(0);
    }
  });

  it("setiap kelas mengacu ke jenjang yang ada", () => {
    const levelIds = new Set(levels.map((l) => l.id));
    for (const c of courses) expect(levelIds.has(c.levelId), c.slug).toBe(true);
  });

  it("semua teks punya terjemahan lengkap (tidak kosong)", () => {
    const texts = [
      ...levels.flatMap((l) => [l.name, l.tagline, ...l.subjects]),
      ...courses.flatMap((c) => [c.title, c.summary, ...c.lessons.map((l) => l.title)]),
    ];
    for (const t of texts) {
      for (const [loc, value] of Object.entries(t)) {
        expect(value.trim(), `${loc}: ${JSON.stringify(t)}`).not.toBe("");
      }
    }
  });

  it("harga tidak negatif", () => {
    for (const l of levels) expect(l.price, l.id).toBeGreaterThanOrEqual(0);
  });
});
