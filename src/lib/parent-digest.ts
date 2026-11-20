/** Email ringkasan mingguan untuk orang tua (fungsi murni, dites). */
export type DigestRow = {
  parent_email: string;
  parent_name: string;
  child_name: string;
  lessons_week: number;
  quizzes_week: number;
  avg_quiz_percent: number | null;
  active_days_week: number;
};

export type DigestEmail = { to: string; subject: string; text: string };

export function buildParentDigests(rows: DigestRow[], siteName: string, siteUrl: string): DigestEmail[] {
  const byParent = new Map<string, DigestRow[]>();
  for (const r of rows) byParent.set(r.parent_email, [...(byParent.get(r.parent_email) ?? []), r]);

  return [...byParent.entries()].map(([to, children]) => {
    const greeting = children[0].parent_name ? `Halo ${children[0].parent_name},` : "Halo,";
    const blocks = children.map((c) => {
      const quiz =
        c.quizzes_week > 0
          ? `${c.quizzes_week} kuis, rata-rata skor ${c.avg_quiz_percent ?? 0}%`
          : "belum mengerjakan kuis";
      const note =
        c.active_days_week === 0
          ? "Minggu ini belum ada aktivitas belajar. Yuk ajak belajar sebentar setiap hari."
          : c.active_days_week >= 5
            ? "Konsisten sekali minggu ini. Berikan apresiasi!"
            : "Sudah mulai rutin, tinggal ditambah sedikit lagi.";
      return [
        `• ${c.child_name}`,
        `  - Hari belajar: ${c.active_days_week} dari 7 hari`,
        `  - Pelajaran selesai: ${c.lessons_week}`,
        `  - Kuis: ${quiz}`,
        `  ${note}`,
      ].join("\n");
    });
    const names = children.map((c) => c.child_name).join(", ");
    return {
      to,
      subject: `Ringkasan belajar mingguan ${names} — ${siteName}`,
      text: [
        greeting,
        "",
        `Berikut ringkasan belajar 7 hari terakhir di ${siteName}:`,
        "",
        ...blocks,
        "",
        `Lihat detailnya di ${siteUrl.replace(/\/$/, "")}/id/parent`,
        "",
        `Email ini dikirim karena akun Anda tertaut sebagai orang tua. Untuk berhenti menerima, lepaskan tautan di halaman Orang Tua.`,
      ].join("\n"),
    };
  });
}
