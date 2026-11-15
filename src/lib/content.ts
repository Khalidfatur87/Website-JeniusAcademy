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

/**
 * Data pelajaran yang publik. Video, catatan, dan materi TIDAK ada di sini:
 * dimuat terpisah lewat RPC `lesson_content` hanya bila siswa berhak.
 */
export type Lesson = {
  id: string;
  title: L10n;
  minutes: number;
  /** Pratinjau gratis: bisa ditonton siapa saja, termasuk tamu. */
  freePreview: boolean;
};

/** Isi pelajaran yang terkunci (dari RPC `lesson_content`). */
export type LessonMaterial = { id: string; title: string; path: string; size: number };
export type LessonContent =
  | { access: false }
  | { access: true; youtubeId: string; notes: L10n; materials: LessonMaterial[] };

export type Course = {
  slug: string;
  levelId: string;
  /** Jenjang kelas ini (warna & nama). */
  level: Level;
  title: L10n;
  summary: L10n;
  /** Nama pengajar yang tampil. */
  teacher: string;
  /** Akun guru pemilik (null = dikelola super admin). */
  teacherId: string | null;
  lessons: Lesson[];
  /** Jumlah soal kuis (0 = tanpa kuis). */
  quizCount: number;
};

/** Soal kuis untuk siswa: TANPA kunci jawaban (dinilai di server, lihat `submit_quiz`). */
export type QuizQuestion = {
  id: string;
  prompt: L10n;
  options: L10n[];
};

/** Hasil penilaian server: skor + kunci jawaban & pembahasan tiap soal. */
export type QuizResult = {
  score: number;
  total: number;
  /** false untuk tamu (skor hanya disimpan di perangkat). */
  recorded: boolean;
  results: { id: string; answer: number; explanation: L10n }[];
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
