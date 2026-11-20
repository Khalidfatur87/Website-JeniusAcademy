import type { L10n } from "./content";

/** Soal try-out untuk peserta (tanpa kunci). */
export type TryoutQuestion = { id: string; prompt: L10n; options: L10n[] };
export type TryoutSection = { id: string; title: L10n; minutes: number; questions: TryoutQuestion[] };

/** Ringkasan try-out untuk katalog. */
export type TryoutInfo = {
  slug: string;
  levelId: string;
  title: L10n;
  description: L10n;
  opensAt: string | null;
  closesAt: string | null;
  sections: { id: string; title: L10n; minutes: number }[];
};

export type TryoutWindow = "upcoming" | "open" | "closed";

export function tryoutWindow(t: Pick<TryoutInfo, "opensAt" | "closesAt">, now: Date = new Date()): TryoutWindow {
  if (t.opensAt && now < new Date(t.opensAt)) return "upcoming";
  if (t.closesAt && now > new Date(t.closesAt)) return "closed";
  return "open";
}

export const totalMinutes = (sections: { minutes: number }[]) => sections.reduce((s, x) => s + x.minutes, 0);

/**
 * Subtes berjalan berurutan seperti UTBK: subtes ke-i berakhir pada
 * mulai + jumlah menit subtes 0..i. `skipped` = indeks subtes terakhir yang
 * diselesaikan lebih awal oleh peserta (waktu sisa subtes itu hangus).
 * Mengembalikan indeks subtes aktif (sections.length = semua selesai) dan detik tersisa.
 */
export function currentSection(
  sections: { minutes: number }[],
  startedAt: string,
  now: Date = new Date(),
  finishedThrough = -1,
): { index: number; secondsLeft: number } {
  const start = new Date(startedAt).getTime();
  let end = start;
  for (let i = 0; i < sections.length; i++) {
    end += sections[i].minutes * 60_000;
    if (i <= finishedThrough) continue;
    if (now.getTime() < end) return { index: i, secondsLeft: Math.ceil((end - now.getTime()) / 1000) };
  }
  return { index: sections.length, secondsLeft: 0 };
}

/** 0:05:09 → "05:09"; di atas satu jam → "1:05:09". */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Hasil dari RPC tryout_result. */
export type TryoutResult = {
  score: number;
  total: number;
  submittedAt: string;
  answers: Record<string, number>;
  sectionScores: { id: string; score: number; total: number }[];
  rank: number;
  participants: number;
  key: { id: string; sectionId: string; prompt: L10n; options: L10n[]; answer: number; explanation: L10n }[];
  sectionAvg: Record<string, number>;
};

/** Subtes terlemah (persen terendah) — saran yang dipelajari ulang. */
export function weakestSections(scores: TryoutResult["sectionScores"], limit = 2) {
  return [...scores]
    .filter((s) => s.total > 0)
    .map((s) => ({ ...s, percent: Math.round((s.score / s.total) * 100) }))
    .sort((a, b) => a.percent - b.percent)
    .slice(0, limit);
}
