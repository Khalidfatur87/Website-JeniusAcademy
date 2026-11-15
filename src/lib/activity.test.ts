import { describe, expect, it } from "vitest";
import { clampGoal, countThisWeek, currentStreak, dayKey, startOfWeek, weekDays } from "./activity";

// Waktu lokal (tanpa "Z") supaya tes tidak bergantung zona waktu mesin.
const at = (s: string) => new Date(s).toISOString();
const now = new Date("2026-11-18T10:00:00"); // Rabu

describe("startOfWeek", () => {
  it("minggu dimulai hari Senin", () => {
    expect(dayKey(startOfWeek(now))).toBe("2026-11-16");
    expect(dayKey(startOfWeek(new Date("2026-11-22T23:00:00")))).toBe("2026-11-16"); // Minggu
    expect(dayKey(startOfWeek(new Date("2026-11-16T00:30:00")))).toBe("2026-11-16"); // Senin
  });
});

describe("currentStreak", () => {
  it("menghitung hari berturut-turut sampai hari ini", () => {
    const ts = [at("2026-11-18T08:00:00"), at("2026-11-17T20:00:00"), at("2026-11-16T07:00:00")];
    expect(currentStreak(ts, now)).toBe(3);
  });

  it("belum aktif hari ini tapi kemarin aktif: streak belum putus", () => {
    expect(currentStreak([at("2026-11-17T09:00:00"), at("2026-11-16T09:00:00")], now)).toBe(2);
  });

  it("putus jika ada hari yang terlewat", () => {
    expect(currentStreak([at("2026-11-18T09:00:00"), at("2026-11-16T09:00:00")], now)).toBe(1);
    expect(currentStreak([at("2026-11-15T09:00:00")], now)).toBe(0);
    expect(currentStreak([], now)).toBe(0);
  });

  it("beberapa aktivitas di hari yang sama dihitung sekali", () => {
    expect(currentStreak([at("2026-11-18T08:00:00"), at("2026-11-18T09:00:00")], now)).toBe(1);
  });
});

describe("countThisWeek & weekDays", () => {
  const ts = [at("2026-11-15T23:00:00"), at("2026-11-16T08:00:00"), at("2026-11-18T08:00:00"), at("2026-11-18T09:00:00")];

  it("hanya menghitung sejak Senin", () => {
    expect(countThisWeek(ts, now)).toBe(3);
  });

  it("menandai hari aktif Senin..Minggu", () => {
    expect(weekDays(ts, now)).toEqual([true, false, true, false, false, false, false]);
  });
});

describe("clampGoal", () => {
  it("membatasi target 1–50", () => {
    expect(clampGoal(0)).toBe(1);
    expect(clampGoal(5.4)).toBe(5);
    expect(clampGoal(99)).toBe(50);
    expect(clampGoal(Number.NaN)).toBe(1);
  });
});
