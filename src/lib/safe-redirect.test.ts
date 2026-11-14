import { describe, expect, it } from "vitest";
import { safeNext } from "./safe-redirect";

const FALLBACK = "/id/courses";

describe("safeNext", () => {
  it("menerima path internal dengan awalan bahasa yang sama", () => {
    expect(safeNext("/id/reset-password", "id", FALLBACK)).toBe("/id/reset-password");
    expect(safeNext("/id/courses/sd-pecahan?x=1", "id", FALLBACK)).toBe(
      "/id/courses/sd-pecahan?x=1",
    );
  });

  it("memakai fallback untuk nilai kosong", () => {
    expect(safeNext(null, "id", FALLBACK)).toBe(FALLBACK);
    expect(safeNext(undefined, "id", FALLBACK)).toBe(FALLBACK);
    expect(safeNext("", "id", FALLBACK)).toBe(FALLBACK);
  });

  it.each([
    "//evil.com",
    "//evil.com/id/x",
    "/\\evil.com",
    "/id/\\evil.com",
    "https://evil.com",
    "http://evil.com/id/x",
    "javascript:alert(1)",
    "/en/courses", // bahasa lain
    "/idx/courses", // awalan mirip
    "courses",
    "/id//evil.com",
  ])("menolak %s", (bad) => {
    expect(safeNext(bad, "id", FALLBACK)).toBe(FALLBACK);
  });
});
