import { describe, expect, it } from "vitest";
import { move, reorder } from "./list";

describe("reorder", () => {
  const l = ["a", "b", "c", "d"];

  it("memindahkan ke bawah dan ke atas", () => {
    expect(reorder(l, 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(reorder(l, 3, 1)).toEqual(["a", "d", "b", "c"]);
  });

  it("indeks sama atau di luar batas: tidak berubah", () => {
    expect(reorder(l, 1, 1)).toBe(l);
    expect(reorder(l, -1, 2)).toBe(l);
    expect(reorder(l, 0, 9)).toBe(l);
  });

  it("move satu langkah", () => {
    expect(move(l, 1, -1)).toEqual(["b", "a", "c", "d"]);
    expect(move(l, 3, 1)).toBe(l);
  });
});
