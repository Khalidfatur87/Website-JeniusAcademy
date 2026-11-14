/**
 * TIPE KONTEN (jenjang, kelas, pelajaran, kuis).
 * Isinya disimpan di Supabase dan dikelola lewat CMS (/admin).
 * Teks memakai format { id, en } supaya mendukung multibahasa.
 */
import type { Locale } from "@/config/site";

export type L10n = Record<Locale, string>;

export type Role = "student" | "teacher" | "super_admin";

export type Level = {
  id: string;
  name: L10n;
  tagline: L10n;
  /** Harga per bulan dalam Rupiah. 0 = gratis. */
  price: number;
  /** Harga coret (opsional) untuk diskon. */
  originalPrice?: number;
  /** Tandai sebagai paket unggulan di halaman harga. */
  featured?: boolean;
  /** Mata pelajaran yang ditampilkan di kartu paket. */
  subjects: L10n[];
  /** Warna aksen kartu (hex). */
  color: string;
};

export type Lesson = {
  id: string;
  title: L10n;
  minutes: number;
  /** ID video YouTube (bagian setelah v=). */
  youtubeId: string;
};

export type Course = {
  slug: string;
  levelId: string;
  /** Jenjang kelas ini (warna & nama). */
  level: Level;
  title: L10n;
  summary: L10n;
  /** Nama pengajar yang tampil. */
  teacher: string;
  lessons: Lesson[];
  /** Jumlah soal kuis (0 = tanpa kuis). */
  quizCount: number;
};

export type QuizQuestion = {
  id: string;
  prompt: L10n;
  options: L10n[];
  /** Indeks opsi yang benar (mulai dari 0). */
  answer: number;
  explanation: L10n;
};

/** Pilih teks sesuai bahasa; fallback ke bahasa Indonesia lalu bahasa pertama yang terisi. */
export const tr = (text: Partial<L10n> | null | undefined, locale: string): string => {
  if (!text) return "";
  return (
    text[locale as Locale] ||
    text.id ||
    Object.values(text).find((v): v is string => typeof v === "string" && v !== "") ||
    ""
  );
};
