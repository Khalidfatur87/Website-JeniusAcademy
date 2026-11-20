import { describe, expect, it } from "vitest";
import { buildParentDigests, type DigestRow } from "./parent-digest";

const row = (p: Partial<DigestRow>): DigestRow => ({
  parent_email: "ortu@x.id",
  parent_name: "Bu Sari",
  child_name: "Andi",
  lessons_week: 3,
  quizzes_week: 1,
  avg_quiz_percent: 75,
  active_days_week: 3,
  ...p,
});

describe("buildParentDigests", () => {
  it("satu email per orang tua, semua anak di dalamnya", () => {
    const mails = buildParentDigests(
      [row({}), row({ child_name: "Budi", active_days_week: 0, quizzes_week: 0 }), row({ parent_email: "lain@x.id", parent_name: "" })],
      "JeniusAcademy",
      "https://jenius.id/",
    );
    expect(mails).toHaveLength(2);
    expect(mails[0].to).toBe("ortu@x.id");
    expect(mails[0].subject).toContain("Andi, Budi");
    expect(mails[0].text).toContain("Halo Bu Sari,");
    expect(mails[0].text).toContain("rata-rata skor 75%");
    expect(mails[0].text).toContain("belum ada aktivitas");
    expect(mails[0].text).toContain("https://jenius.id/id/parent");
    expect(mails[1].text.startsWith("Halo,")).toBe(true);
  });
});
