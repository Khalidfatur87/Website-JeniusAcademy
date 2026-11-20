/** Kelas live (fungsi murni): status waktu dan file kalender .ics. */

export type LivePhase = "upcoming" | "soon" | "live" | "ended";

/** "soon" = 15 menit sebelum mulai (link masuk sudah dibuka server). */
export function livePhase(startsAt: string, minutes: number, now: Date = new Date()): LivePhase {
  const start = new Date(startsAt).getTime();
  const end = start + minutes * 60_000;
  const t = now.getTime();
  if (t >= end) return "ended";
  if (t >= start) return "live";
  if (t >= start - 15 * 60_000) return "soon";
  return "upcoming";
}

const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Escape teks iCalendar (RFC 5545): \ ; , dan baris baru. */
const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** File .ics dengan pengingat 15 menit sebelum mulai. */
export function buildIcs(input: {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  minutes: number;
  url: string;
  now?: Date;
}): string {
  const start = new Date(input.startsAt);
  const end = new Date(start.getTime() + input.minutes * 60_000);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//JeniusAcademy//Live//ID",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${input.id}@jeniusacademy`,
    `DTSTAMP:${icsDate(input.now ?? new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(input.title)}`,
    `DESCRIPTION:${icsText([input.description, input.url].filter(Boolean).join("\n\n"))}`,
    `URL:${input.url}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsText(input.title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
