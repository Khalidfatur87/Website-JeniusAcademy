import { describe, expect, it } from "vitest";
import { currentSection, formatClock, totalMinutes, tryoutWindow, weakestSections } from "./tryout";

const sections = [{ minutes: 10 }, { minutes: 5 }, { minutes: 20 }];
const start = "2026-11-20T10:00:00Z";
const at = (min: number, sec = 0) => new Date(Date.parse(start) + min * 60_000 + sec * 1000);

describe("currentSection", () => {
  it("subtes berurutan sesuai menitnya", () => {
    expect(currentSection(sections, start, at(0))).toEqual({ index: 0, secondsLeft: 600 });
    expect(currentSection(sections, start, at(9, 30))).toEqual({ index: 0, secondsLeft: 30 });
    expect(currentSection(sections, start, at(10))).toEqual({ index: 1, secondsLeft: 300 });
    expect(currentSection(sections, start, at(16))).toEqual({ index: 2, secondsLeft: 1140 });
  });

  it("selesai semua setelah total waktu", () => {
    expect(currentSection(sections, start, at(35))).toEqual({ index: 3, secondsLeft: 0 });
  });

  it("subtes yang diselesaikan lebih awal dilewati, sisa waktunya hangus", () => {
    expect(currentSection(sections, start, at(2), 0)).toEqual({ index: 1, secondsLeft: 780 });
    expect(currentSection(sections, start, at(2), 2)).toEqual({ index: 3, secondsLeft: 0 });
  });
});

describe("formatClock & totalMinutes", () => {
  it("format jam", () => {
    expect(formatClock(309)).toBe("05:09");
    expect(formatClock(3909)).toBe("1:05:09");
    expect(formatClock(-5)).toBe("00:00");
  });
  it("jumlah menit", () => {
    expect(totalMinutes(sections)).toBe(35);
  });
});

describe("tryoutWindow", () => {
  const now = new Date("2026-11-20T10:00:00Z");
  it("membaca jadwal", () => {
    expect(tryoutWindow({ opensAt: null, closesAt: null }, now)).toBe("open");
    expect(tryoutWindow({ opensAt: "2026-11-21T00:00:00Z", closesAt: null }, now)).toBe("upcoming");
    expect(tryoutWindow({ opensAt: null, closesAt: "2026-11-19T00:00:00Z" }, now)).toBe("closed");
  });
});

describe("weakestSections", () => {
  it("urut dari persen terendah", () => {
    const r = weakestSections([
      { id: "a", score: 8, total: 10 },
      { id: "b", score: 2, total: 10 },
      { id: "c", score: 5, total: 10 },
      { id: "d", score: 0, total: 0 },
    ]);
    expect(r.map((x) => x.id)).toEqual(["b", "c"]);
    expect(r[0].percent).toBe(20);
  });
});
