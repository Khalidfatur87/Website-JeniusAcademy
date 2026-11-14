/**
 * ULASAN AWAL / SEED REVIEWS
 * ------------------------------------------------------------------
 * PLACEHOLDER — nama dan isi ulasan di bawah fiktif. Ganti dengan
 * testimoni asli (dengan izin penulisnya) sebelum rilis.
 * Ulasan yang dikirim lewat formulir tersimpan di tabel `reviews`
 * dan tampil setelah disetujui super admin (CMS → Ulasan).
 */
import type { L10n } from "@/lib/content";

export type Review = {
  id: string;
  name: string;
  /** Id jenjang (tabel levels). */
  levelId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  date: string; // ISO
  text: L10n;
};

export const seedReviews: Review[] = [
  {
    id: "r1",
    name: "Nama Contoh 1",
    levelId: "sma",
    rating: 5,
    date: "2026-05-21",
    text: {
      id: "Materinya runtut dan penjelasannya mudah dipahami. Nilai ulangan saya naik sejak belajar rutin di sini.",
      en: "The material is well structured and easy to follow. My test scores improved after studying here regularly.",
    },
  },
  {
    id: "r2",
    name: "Nama Contoh 2",
    levelId: "smp",
    rating: 5,
    date: "2026-05-22",
    text: {
      id: "Video singkat dan jelas, jadi tidak bosan. Latihan soalnya membantu memahami konsep, bukan sekadar menghafal.",
      en: "Short, clear videos so it never gets boring. The practice questions build understanding rather than memorisation.",
    },
  },
  {
    id: "r3",
    name: "Nama Contoh 3",
    levelId: "sd",
    rating: 4,
    date: "2026-05-21",
    text: {
      id: "Anak saya jadi lebih semangat belajar. Tampilannya ramah anak dan progresnya mudah dipantau.",
      en: "My child is more motivated to learn. The interface is kid-friendly and progress is easy to track.",
    },
  },
  {
    id: "r4",
    name: "Nama Contoh 4",
    levelId: "utbk",
    rating: 5,
    date: "2026-05-23",
    text: {
      id: "Strategi pengerjaan soalnya sangat membantu mengatur waktu saat simulasi UTBK.",
      en: "The solving strategies really helped me manage time during UTBK simulations.",
    },
  },
];
