import { describe, expect, it } from "vitest";
import { formatDate, formatPrice, fromLocalInput, toLocalInput } from "./format";

describe("formatPrice", () => {
  it("format Rupiah tanpa desimal", () => {
    const text = formatPrice(149000, "id");
    expect(text).toMatch(/Rp/);
    expect(text).toMatch(/149\.000/);
    expect(text).not.toMatch(/,\d{2}$/);
  });

  it("locale lain memakai format en-US dengan kode mata uang yang sama", () => {
    expect(formatPrice(149000, "en")).toMatch(/149,000/);
  });
});

describe("formatDate", () => {
  it("memformat sesuai bahasa", () => {
    expect(formatDate("2026-05-21", "id")).toMatch(/2026/);
    expect(formatDate("2026-05-21", "en")).toMatch(/May/);
  });
});

describe("datetime-local", () => {
  it("bolak-balik ISO ↔ input lokal", () => {
    const iso = new Date(2026, 10, 20, 19, 5).toISOString();
    expect(toLocalInput(iso)).toBe("2026-11-20T19:05");
    expect(fromLocalInput("2026-11-20T19:05")).toBe(iso);
  });
  it("kosong / tidak valid", () => {
    expect(toLocalInput(null)).toBe("");
    expect(toLocalInput("bukan tanggal")).toBe("");
    expect(fromLocalInput("")).toBeNull();
    expect(fromLocalInput("xx")).toBeNull();
  });
});
