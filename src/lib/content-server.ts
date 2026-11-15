import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";
import type { Course, L10n, Lesson, Level, QuizQuestion } from "./content";

/**
 * Membaca konten publik dari Supabase (hanya di server).
 * Memakai client tanpa sesi login supaya halaman tetap bisa dibangun statis
 * dan di-cache (ISR); RLS hanya mengembalikan kelas yang sudah terbit.
 * Tanpa kunci Supabase (mis. build di CI), semua fungsi mengembalikan data kosong.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const publicClient = () =>
  url && key
    ? createSupabaseClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

// ---- baris database → tipe aplikasi ---------------------------------------

export type LevelRow = {
  id: string;
  name: L10n;
  tagline: L10n;
  price: number;
  original_price: number | null;
  featured: boolean;
  subjects: L10n[];
  color: string;
  position: number;
};

/** Kolom pelajaran yang publik (video & catatan hanya lewat RPC lesson_content). */
export type LessonRow = {
  id: string;
  title: L10n;
  minutes: number;
  free_preview: boolean;
  position: number;
};

/** Kolom soal yang publik (kunci jawaban & pembahasan tidak bisa dibaca langsung). */
export type QuestionRow = {
  id: string;
  prompt: L10n;
  options: L10n[];
  position: number;
};

export const LEVEL_COLUMNS =
  "id, name, tagline, price, original_price, featured, subjects, color, position";

export const toLevel = (r: LevelRow): Level => ({
  id: r.id,
  name: r.name,
  tagline: r.tagline,
  price: r.price,
  originalPrice: r.original_price ?? undefined,
  featured: r.featured,
  subjects: r.subjects ?? [],
  color: r.color,
});

export const toLesson = (r: LessonRow): Lesson => ({
  id: r.id,
  title: r.title,
  minutes: r.minutes,
  freePreview: r.free_preview,
});

export const toQuestion = (r: QuestionRow): QuizQuestion => ({
  id: r.id,
  prompt: r.prompt,
  options: r.options,
});

/** Sertifikat untuk halaman verifikasi publik (null jika kode tidak ditemukan). */
export type Certificate = {
  code: string;
  recipientName: string;
  courseSlug: string;
  courseTitle: L10n;
  score: number | null;
  total: number | null;
  issuedAt: string;
};

export const getCertificate = cache(async (code: string): Promise<Certificate | null> => {
  const sb = publicClient();
  if (!sb || !/^[A-Za-z0-9]{6,32}$/.test(code)) return null;
  const { data, error } = await sb.rpc("get_certificate", { p_code: code });
  if (error) throw new Error(`certificate: ${error.message}`);
  const r = (data as {
    code: string;
    recipient_name: string;
    course_slug: string;
    course_title: L10n;
    score: number | null;
    total: number | null;
    issued_at: string;
  }[])[0];
  return r
    ? {
        code: r.code,
        recipientName: r.recipient_name,
        courseSlug: r.course_slug,
        courseTitle: r.course_title,
        score: r.score,
        total: r.total,
        issuedAt: r.issued_at,
      }
    : null;
});

export const byPosition = <T extends { position: number }>(a: T, b: T) => a.position - b.position;

/** Jenjang pengganti bila jenjang kelas tidak ditemukan (seharusnya tidak terjadi: ada FK). */
const fallbackLevel = (id: string): Level => ({
  id,
  name: { id, en: id },
  tagline: { id: "", en: "" },
  price: 0,
  subjects: [],
  color: "#0085FF",
});

type CourseRow = {
  slug: string;
  level_id: string;
  title: L10n;
  summary: L10n;
  teacher_name: string;
  teacher_id: string | null;
  lessons: LessonRow[];
  quiz_questions: { id: string }[];
};

const COURSE_COLUMNS =
  "slug, level_id, title, summary, teacher_name, teacher_id, lessons(id, title, minutes, free_preview, position), quiz_questions(id)";
// Catatan: agregat `(count)` tidak bisa dipakai karena lessons / quiz_questions
// hanya memberi izin baca per kolom (kolom rahasia disembunyikan), jadi id dihitung di sini.

// ---- kueri ----------------------------------------------------------------

export const getLevels = cache(async (): Promise<Level[]> => {
  const sb = publicClient();
  if (!sb) return [];
  const { data, error } = await sb.from("levels").select(LEVEL_COLUMNS).order("position");
  if (error) throw new Error(`levels: ${error.message}`);
  return (data as LevelRow[]).map(toLevel);
});

/** Semua kelas yang sudah terbit, beserta pelajaran dan jumlah soal kuis. */
export const getCourses = cache(async (): Promise<Course[]> => {
  const sb = publicClient();
  if (!sb) return [];
  const [levels, { data, error }] = await Promise.all([
    getLevels(),
    sb
      .from("courses")
      .select(COURSE_COLUMNS)
      .eq("published", true)
      .order("position")
      .order("slug"),
  ]);
  if (error) throw new Error(`courses: ${error.message}`);

  const levelMap = new Map(levels.map((l) => [l.id, l]));
  // Urutkan sesuai urutan jenjang, lalu posisi kelas.
  const order = new Map(levels.map((l, i) => [l.id, i]));
  return (data as CourseRow[])
    .map(
      (r): Course => ({
        slug: r.slug,
        levelId: r.level_id,
        level: levelMap.get(r.level_id) ?? fallbackLevel(r.level_id),
        title: r.title,
        summary: r.summary,
        teacher: r.teacher_name,
        teacherId: r.teacher_id,
        lessons: [...(r.lessons ?? [])].sort(byPosition).map(toLesson),
        quizCount: r.quiz_questions?.length ?? 0,
      }),
    )
    .filter((c) => c.lessons.length > 0)
    .sort((a, b) => (order.get(a.levelId) ?? 99) - (order.get(b.levelId) ?? 99));
});

export const getCourse = cache(async (slug: string) =>
  (await getCourses()).find((c) => c.slug === slug),
);

/** Soal kuis tanpa kunci jawaban. */
export const getQuiz = cache(async (slug: string): Promise<QuizQuestion[]> => {
  const sb = publicClient();
  if (!sb) return [];
  const { data, error } = await sb
    .from("quiz_questions")
    .select("id, prompt, options, position")
    .eq("course_slug", slug)
    .order("position");
  if (error) throw new Error(`quiz: ${error.message}`);
  return (data as QuestionRow[]).map(toQuestion);
});
