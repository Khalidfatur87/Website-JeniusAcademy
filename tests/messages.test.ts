import { describe, expect, it } from "vitest";
import en from "../messages/en.json";
import id from "../messages/id.json";

/** Semua jalur kunci, mis. "auth.errors.generic". */
function keyPaths(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return [prefix];
  return Object.entries(obj).flatMap(([k, v]) => keyPaths(v, prefix ? `${prefix}.${k}` : k));
}

/** Nama argumen ICU seperti {name} atau {count, plural, …}; teks di dalam blok plural diabaikan. */
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\s*[,}]/g)].map((m) => m[1]).sort();

function leaves(obj: unknown, prefix = ""): [string, string][] {
  if (typeof obj === "string") return [[prefix, obj]];
  if (obj === null || typeof obj !== "object") return [];
  return Object.entries(obj).flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k));
}

describe("terjemahan ID/EN", () => {
  it("kunci identik di kedua bahasa", () => {
    const a = new Set(keyPaths(id));
    const b = new Set(keyPaths(en));
    expect([...a].filter((k) => !b.has(k)), "ada di id, tidak ada di en").toEqual([]);
    expect([...b].filter((k) => !a.has(k)), "ada di en, tidak ada di id").toEqual([]);
  });

  it("tidak ada teks kosong", () => {
    for (const [path, text] of [...leaves(id), ...leaves(en)]) {
      expect(text.trim(), path).not.toBe("");
    }
  });

  it("placeholder {…} sama di kedua bahasa", () => {
    const enMap = new Map(leaves(en));
    for (const [path, text] of leaves(id)) {
      const other = enMap.get(path);
      if (other === undefined) continue;
      expect(placeholders(other), path).toEqual(placeholders(text));
    }
  });
});
