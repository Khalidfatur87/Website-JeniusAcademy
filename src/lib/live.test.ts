import { describe, expect, it } from "vitest";
import shared from "../../shared/fixtures/live.json";
import { buildIcs, livePhase } from "./live";

describe("livePhase", () => {
  const start = "2026-11-20T12:00:00Z";
  const at = (iso: string) => new Date(iso);
  it("fase sesuai waktu", () => {
    expect(livePhase(start, 60, at("2026-11-20T11:00:00Z"))).toBe("upcoming");
    expect(livePhase(start, 60, at("2026-11-20T11:50:00Z"))).toBe("soon");
    expect(livePhase(start, 60, at("2026-11-20T12:30:00Z"))).toBe("live");
    expect(livePhase(start, 60, at("2026-11-20T13:00:00Z"))).toBe("ended");
  });
});

describe("buildIcs", () => {
  it("acara dengan pengingat dan teks ter-escape", () => {
    const ics = buildIcs({
      id: "abc",
      title: "Live: Fisika, Hukum Newton; bagian 1",
      description: "Baris 1\nBaris 2",
      startsAt: "2026-11-20T12:00:00Z",
      minutes: 90,
      url: "https://jenius.id/id/live/abc",
      now: new Date("2026-11-01T00:00:00Z"),
    });
    expect(ics).toContain("DTSTART:20261120T120000Z");
    expect(ics).toContain("DTEND:20261120T133000Z");
    expect(ics).toContain("SUMMARY:Live: Fisika\\, Hukum Newton\; bagian 1");
    expect(ics).toContain("DESCRIPTION:Baris 1\\nBaris 2\\n\\nhttps://jenius.id/id/live/abc");
    expect(ics).toContain("TRIGGER:-PT15M");
    expect(ics.split("\r\n")[0]).toBe("BEGIN:VCALENDAR");
  });
});

// Kasus uji bersama dengan aplikasi mobile (mobile/test/domain/live_test.dart).
describe("kasus uji bersama (shared/fixtures/live.json)", () => {
  it.each(shared.livePhase)("livePhase pada $now", ({ now, expected }) => {
    expect(livePhase(shared.startsAt, shared.minutes, new Date(now))).toBe(expected);
  });
});
