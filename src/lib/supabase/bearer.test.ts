import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: async () => ({ getAll: () => [], set: () => {} }) }));

const { bearerToken } = await import("./server");

const req = (auth?: string) => new Request("https://x.test/api/tutor", { headers: auth ? { authorization: auth } : {} });

describe("bearerToken", () => {
  it("membaca token Bearer dari aplikasi mobile", () => {
    expect(bearerToken(req("Bearer abc.def.ghi"))).toBe("abc.def.ghi");
    expect(bearerToken(req("bearer   tok"))).toBe("tok");
  });
  it("tanpa header atau format lain → null (website memakai cookie)", () => {
    expect(bearerToken(req())).toBeNull();
    expect(bearerToken(req("Basic dXNlcjpwYXNz"))).toBeNull();
    expect(bearerToken(req("Bearer"))).toBeNull();
    expect(bearerToken(req("Bearer a b"))).toBeNull();
  });
});
