import { describe, expect, it } from "vitest";
import type { Course, Level } from "@/lib/content";
import { activeSubscription, firstPreview, hasCourseAccess, isLessonOpen } from "./access";

const level = (price: number): Level => ({
  id: "sma",
  name: { id: "SMA", en: "SMA" },
  tagline: { id: "", en: "" },
  price,
  subjects: [],
  color: "#000000",
});

const course = (price: number, teacherId: string | null = null): Course => ({
  slug: "sma-fisika",
  levelId: "sma",
  level: level(price),
  title: { id: "F", en: "F" },
  summary: { id: "", en: "" },
  teacher: "",
  teacherId,
  quizCount: 0,
  lessons: [
    { id: "l1", title: { id: "a", en: "a" }, minutes: 1, freePreview: false },
    { id: "l2", title: { id: "b", en: "b" }, minutes: 1, freePreview: true },
  ],
});

const now = new Date("2026-06-01T00:00:00Z");
const student = { id: "u1", role: "student" as const };

describe("hasCourseAccess", () => {
  it("kelas gratis terbuka untuk semua, termasuk tamu", () => {
    expect(hasCourseAccess(course(0), [], null, now)).toBe(true);
  });

  it("kelas berbayar butuh langganan aktif pada jenjangnya", () => {
    expect(hasCourseAccess(course(1000), [], student, now)).toBe(false);
    expect(hasCourseAccess(course(1000), [{ levelId: "smp", expiresAt: null }], student, now)).toBe(false);
    expect(hasCourseAccess(course(1000), [{ levelId: "sma", expiresAt: null }], student, now)).toBe(true);
    expect(
      hasCourseAccess(course(1000), [{ levelId: "sma", expiresAt: "2026-07-01T00:00:00Z" }], student, now),
    ).toBe(true);
  });

  it("langganan kedaluwarsa tidak memberi akses", () => {
    expect(
      hasCourseAccess(course(1000), [{ levelId: "sma", expiresAt: "2026-05-31T00:00:00Z" }], student, now),
    ).toBe(false);
  });

  it("super admin dan guru pemilik selalu punya akses", () => {
    expect(hasCourseAccess(course(1000), [], { id: "a", role: "super_admin" }, now)).toBe(true);
    expect(hasCourseAccess(course(1000, "t1"), [], { id: "t1", role: "teacher" }, now)).toBe(true);
    expect(hasCourseAccess(course(1000, "t1"), [], { id: "t2", role: "teacher" }, now)).toBe(false);
  });
});

describe("activeSubscription", () => {
  it("memilih yang berakhir paling lama; tanpa batas didahulukan", () => {
    const a = { levelId: "sma", expiresAt: "2026-07-01T00:00:00Z" };
    const b = { levelId: "sma", expiresAt: "2026-09-01T00:00:00Z" };
    const c = { levelId: "sma", expiresAt: null };
    expect(activeSubscription([a, b], "sma", now)).toEqual(b);
    expect(activeSubscription([a, c, b], "sma", now)).toEqual(c);
    expect(activeSubscription([a], "smp", now)).toBeUndefined();
  });
});

describe("pratinjau", () => {
  it("pelajaran pratinjau terbuka tanpa akses kelas", () => {
    const c = course(1000);
    expect(isLessonOpen(c.lessons[0], false)).toBe(false);
    expect(isLessonOpen(c.lessons[1], false)).toBe(true);
    expect(isLessonOpen(c.lessons[0], true)).toBe(true);
    expect(firstPreview(c)?.id).toBe("l2");
  });
});
