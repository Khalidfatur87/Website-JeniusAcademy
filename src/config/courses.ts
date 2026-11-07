/**
 * DATA KELAS / COURSE CONTENT
 * ------------------------------------------------------------------
 * Semua jenjang, kelas, pelajaran, dan harga ada di sini.
 * Tambah/ubah/hapus entri tanpa menyentuh komponen. Teks memakai
 * format { id, en } supaya mendukung multibahasa.
 *
 * SEMUA ISI DI BAWAH ADALAH CONTOH (PLACEHOLDER): nama pengajar,
 * judul, durasi, harga, dan ID video YouTube harus diganti.
 */
import type { Locale } from "./site";

export type L10n = Record<Locale, string>;

export type LevelId = "sd" | "smp" | "sma" | "utbk";

export type Level = {
  id: LevelId;
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
  /** ID video YouTube (bagian setelah v=). PLACEHOLDER. */
  youtubeId: string;
};

export type Course = {
  slug: string;
  levelId: LevelId;
  title: L10n;
  summary: L10n;
  /** PLACEHOLDER — ganti dengan nama pengajar asli. */
  teacher: string;
  lessons: Lesson[];
};

const PLACEHOLDER_VIDEO = "y1BZBU5YXcM";

export const levels: Level[] = [
  {
    id: "sd",
    name: { id: "Sekolah Dasar", en: "Elementary School" },
    tagline: {
      id: "Fondasi belajar yang menyenangkan",
      en: "A joyful foundation for learning",
    },
    price: 0,
    color: "#22C55E",
    subjects: [
      { id: "Matematika", en: "Mathematics" },
      { id: "Bahasa Indonesia", en: "Indonesian" },
      { id: "IPA", en: "Natural Science" },
      { id: "IPS", en: "Social Science" },
    ],
  },
  {
    id: "smp",
    name: { id: "Sekolah Menengah Pertama", en: "Junior High School" },
    tagline: {
      id: "Perkuat konsep sebelum melangkah lebih jauh",
      en: "Strengthen concepts before moving on",
    },
    price: 0,
    color: "#0085FF",
    subjects: [
      { id: "Matematika", en: "Mathematics" },
      { id: "Bahasa Indonesia", en: "Indonesian" },
      { id: "IPA", en: "Natural Science" },
      { id: "IPS", en: "Social Science" },
      { id: "Bahasa Inggris", en: "English" },
    ],
  },
  {
    id: "sma",
    name: { id: "Sekolah Menengah Atas", en: "Senior High School" },
    tagline: {
      id: "Siap menghadapi ujian dan kuliah",
      en: "Ready for exams and university",
    },
    price: 499000,
    color: "#8B5CF6",
    subjects: [
      { id: "Matematika", en: "Mathematics" },
      { id: "Fisika", en: "Physics" },
      { id: "Kimia", en: "Chemistry" },
      { id: "Biologi", en: "Biology" },
      { id: "Bahasa Inggris", en: "English" },
    ],
  },
  {
    id: "utbk",
    name: { id: "Persiapan UTBK", en: "University Entrance (UTBK)" },
    tagline: {
      id: "Strategi dan latihan untuk lolos PTN impian",
      en: "Strategy and practice to get into your dream university",
    },
    price: 249000,
    originalPrice: 499000,
    featured: true,
    color: "#F97316",
    subjects: [
      { id: "Penalaran Umum", en: "General Reasoning" },
      { id: "Pengetahuan Kuantitatif", en: "Quantitative Knowledge" },
      { id: "Literasi Bahasa", en: "Language Literacy" },
      { id: "Saintek & Soshum", en: "Science & Humanities" },
    ],
  },
];

export const courses: Course[] = [
  {
    slug: "sd-pecahan",
    levelId: "sd",
    title: { id: "Perkalian Pecahan", en: "Multiplying Fractions" },
    summary: {
      id: "Memahami pecahan lewat contoh sehari-hari dan latihan bertahap.",
      en: "Understand fractions through everyday examples and gradual practice.",
    },
    teacher: "Pengajar Contoh A",
    lessons: [
      { id: "l1", title: { id: "Operasi hitung bilangan bulat", en: "Integer arithmetic" }, minutes: 12, youtubeId: PLACEHOLDER_VIDEO },
      { id: "l2", title: { id: "Pengenalan pecahan", en: "Introducing fractions" }, minutes: 15, youtubeId: PLACEHOLDER_VIDEO },
      { id: "l3", title: { id: "Mengalikan pecahan", en: "Multiplying fractions" }, minutes: 18, youtubeId: PLACEHOLDER_VIDEO },
      { id: "l4", title: { id: "Latihan soal cerita", en: "Word problem practice" }, minutes: 20, youtubeId: PLACEHOLDER_VIDEO },
    ],
  },
  {
    slug: "smp-aljabar",
    levelId: "smp",
    title: { id: "Dasar Aljabar", en: "Algebra Basics" },
    summary: {
      id: "Dari variabel hingga persamaan linear, dijelaskan langkah demi langkah.",
      en: "From variables to linear equations, explained step by step.",
    },
    teacher: "Pengajar Contoh B",
    lessons: [
      { id: "l1", title: { id: "Bilangan pecahan", en: "Fractional numbers" }, minutes: 14, youtubeId: PLACEHOLDER_VIDEO },
      { id: "l2", title: { id: "Operasi bentuk aljabar", en: "Algebraic operations" }, minutes: 18, youtubeId: PLACEHOLDER_VIDEO },
      { id: "l3", title: { id: "Persamaan linear", en: "Linear equations" }, minutes: 20, youtubeId: PLACEHOLDER_VIDEO },
      { id: "l4", title: { id: "Pertidaksamaan linear", en: "Linear inequalities" }, minutes: 20, youtubeId: PLACEHOLDER_VIDEO },
    ],
  },
  {
    slug: "sma-fisika",
    levelId: "sma",
    title: { id: "Fisika Dasar", en: "Foundations of Physics" },
    summary: {
      id: "Gerak, gaya, dan energi dengan visualisasi yang mudah dipahami.",
      en: "Motion, force, and energy with easy-to-follow visuals.",
    },
    teacher: "Pengajar Contoh C",
    lessons: [
      { id: "l1", title: { id: "Besaran dan satuan", en: "Quantities and units" }, minutes: 16, youtubeId: PLACEHOLDER_VIDEO },
      { id: "l2", title: { id: "Gerak lurus", en: "Linear motion" }, minutes: 22, youtubeId: PLACEHOLDER_VIDEO },
      { id: "l3", title: { id: "Hukum Newton", en: "Newton's laws" }, minutes: 24, youtubeId: PLACEHOLDER_VIDEO },
      { id: "l4", title: { id: "Usaha dan energi", en: "Work and energy" }, minutes: 22, youtubeId: PLACEHOLDER_VIDEO },
      { id: "l5", title: { id: "Latihan campuran", en: "Mixed practice" }, minutes: 30, youtubeId: PLACEHOLDER_VIDEO },
    ],
  },
  {
    slug: "sma-trigonometri",
    levelId: "sma",
    title: { id: "Trigonometri", en: "Trigonometry" },
    summary: {
      id: "Sinus, cosinus, tangen, dan penerapannya pada soal ujian.",
      en: "Sine, cosine, tangent and how they appear in exam questions.",
    },
    teacher: "Pengajar Contoh C",
    lessons: [
      { id: "l1", title: { id: "Perbandingan trigonometri", en: "Trigonometric ratios" }, minutes: 18, youtubeId: PLACEHOLDER_VIDEO },
      { id: "l2", title: { id: "Sudut istimewa", en: "Special angles" }, minutes: 16, youtubeId: PLACEHOLDER_VIDEO },
      { id: "l3", title: { id: "Identitas trigonometri", en: "Trigonometric identities" }, minutes: 22, youtubeId: PLACEHOLDER_VIDEO },
    ],
  },
  {
    slug: "utbk-saintek",
    levelId: "utbk",
    title: { id: "Strategi UTBK Saintek", en: "UTBK Science Strategy" },
    summary: {
      id: "Ringkasan materi, trik pengerjaan, dan latihan soal bertema Saintek.",
      en: "Concept recaps, solving techniques and Science-track practice sets.",
    },
    teacher: "Pengajar Contoh D",
    lessons: [
      { id: "l1", title: { id: "Peta materi Saintek", en: "Science-track roadmap" }, minutes: 25, youtubeId: PLACEHOLDER_VIDEO },
      { id: "l2", title: { id: "Penalaran kuantitatif", en: "Quantitative reasoning" }, minutes: 35, youtubeId: PLACEHOLDER_VIDEO },
    ],
  },
  {
    slug: "utbk-soshum",
    levelId: "utbk",
    title: { id: "Strategi UTBK Soshum", en: "UTBK Humanities Strategy" },
    summary: {
      id: "Pahami pola soal Soshum dan kelola waktu pengerjaan dengan efektif.",
      en: "Learn Humanities question patterns and manage your exam time well.",
    },
    teacher: "Pengajar Contoh D",
    lessons: [
      { id: "l1", title: { id: "Peta materi Soshum", en: "Humanities-track roadmap" }, minutes: 25, youtubeId: PLACEHOLDER_VIDEO },
      { id: "l2", title: { id: "Literasi dan penalaran", en: "Literacy and reasoning" }, minutes: 30, youtubeId: PLACEHOLDER_VIDEO },
    ],
  },
];

export const getLevel = (id: LevelId) => levels.find((l) => l.id === id)!;
export const getCourse = (slug: string) => courses.find((c) => c.slug === slug);
export const coursesByLevel = (id: LevelId) =>
  courses.filter((c) => c.levelId === id);

/** Pilih teks sesuai bahasa; fallback ke bahasa pertama yang terisi. */
export const tr = (text: L10n, locale: string): string =>
  text[locale as Locale] ?? text.id ?? Object.values(text)[0] ?? "";
