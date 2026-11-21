/** Isi notifikasi pengingat belajar harian (dipakai Web Push & aplikasi mobile). */
export function reminderMessage(streakActive: boolean, siteName: string) {
  return {
    title: siteName,
    body: streakActive
      ? "Streak belajarmu masih jalan! Belajar 5 menit hari ini supaya tidak putus 🔥"
      : "Yuk belajar sebentar hari ini. Satu pelajaran saja sudah cukup.",
  };
}
