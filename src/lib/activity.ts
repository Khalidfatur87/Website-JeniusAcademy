/**
 * STREAK & TARGET MINGGUAN (fungsi murni).
 * Satu "hari aktif" = ada pelajaran yang ditandai selesai atau kuis yang dikerjakan.
 * Tanggal dihitung di zona waktu perangkat.
 */

/** "YYYY-MM-DD" di zona waktu lokal. */
export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

/** Senin 00:00 (lokal) dari minggu yang memuat `d`. */
export function startOfWeek(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const offset = (x.getDay() + 6) % 7; // Senin = 0
  return addDays(x, -offset);
}

/**
 * Hari berturut-turut yang aktif sampai hari ini. Jika hari ini belum aktif
 * tetapi kemarin aktif, streak masih dihitung (belum putus).
 */
export function currentStreak(timestamps: string[], now: Date = new Date()): number {
  const days = new Set(timestamps.map((t) => dayKey(new Date(t))));
  let cursor = days.has(dayKey(now)) ? now : addDays(now, -1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Banyaknya kejadian (mis. pelajaran selesai) sejak Senin minggu ini. */
export function countThisWeek(timestamps: string[], now: Date = new Date()): number {
  const start = startOfWeek(now).getTime();
  const end = now.getTime();
  return timestamps.filter((t) => {
    const x = new Date(t).getTime();
    return x >= start && x <= end + 60_000;
  }).length;
}

/** Hari aktif minggu ini, Senin..Minggu (untuk deretan titik). */
export function weekDays(timestamps: string[], now: Date = new Date()): boolean[] {
  const days = new Set(timestamps.map((t) => dayKey(new Date(t))));
  const start = startOfWeek(now);
  return Array.from({ length: 7 }, (_, i) => days.has(dayKey(addDays(start, i))));
}

export const clampGoal = (n: number) => Math.min(50, Math.max(1, Math.round(n) || 1));
