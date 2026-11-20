/**
 * PUSAT KONFIGURASI SITUS / SITE CONFIGURATION
 * ------------------------------------------------------------------
 * Ubah nilai di file ini untuk mengganti identitas, warna, kontak,
 * sosial media, dan fitur tanpa menyentuh komponen.
 * Edit the values here to change identity, colors, contact details,
 * socials and feature flags without touching components.
 *
 * Semua nilai bertanda PLACEHOLDER harus diganti sebelum rilis.
 */

/** Bahasa yang tersedia. Tambah kode baru + file messages/<kode>.json. */
export const locales = ["id", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "id";

/** Nama yang tampil di pemilih bahasa. */
export const localeLabels: Record<Locale, { label: string; short: string }> = {
  id: { label: "Bahasa Indonesia", short: "ID" },
  en: { label: "English", short: "EN" },
};

export const siteConfig = {
  name: "JeniusAcademy",
  /** Dipakai untuk wordmark berwarna: "Jenius" + "Academy". */
  wordmark: { first: "Jenius", second: "Academy" },

  /**
   * LOGO
   * - `mark`: simbol logo yang tampil di samping tulisan "JeniusAcademy".
   *   null = kotak huruf pertama nama situs.
   * - `src`: logo LENGKAP (simbol + tulisan dalam satu gambar). Jika diisi,
   *   gambar ini menggantikan simbol + tulisan sekaligus.
   * File diletakkan di /public/brand. Favicon ada di src/app/icon.png & apple-icon.png.
   */
  logo: {
    mark: { src: "/brand/logo-mark.png" as string | null, width: 239, height: 160 },
    src: null as string | null,
    width: 160,
    height: 40,
  },

  /** Domain produksi, dipakai untuk metadata/SEO. PLACEHOLDER. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com",

  /**
   * Warna brand, diambil dari logo (toska & ungu). Diterapkan ke seluruh situs
   * lewat CSS variable. Tombol memakai versi lebih gelap dari `primary`, jadi
   * teks putih tetap terbaca (kontras ±6,4:1). `accent` dipakai di belakang
   * teks putih (lencana "Terlaris"): jangan dibuat lebih terang (kontras 4,7:1).
   */
  colors: {
    primary: "#2B93A8",
    accent: "#6A6BBD",
  },

  /** Kontak. PLACEHOLDER: kosongkan string untuk menyembunyikan baris itu. */
  contact: {
    email: "hello@example.com",
    phone: "+62 000 0000 0000",
    whatsapp: "", // contoh: "6281234567890"
    address: "",
  },

  /** Sosial media. Kosongkan string untuk menyembunyikan ikon. */
  socials: {
    instagram: "",
    youtube: "",
    tiktok: "",
    x: "",
    facebook: "",
  },

  /** Angka statistik di beranda. PLACEHOLDER — ganti dengan data asli. */
  stats: [
    { value: "10K+", key: "students" },
    { value: "120+", key: "lessons" },
    { value: "4", key: "levels" },
    { value: "4.9/5", key: "rating" },
  ],

  currency: { code: "IDR", locale: "id-ID" },

  /**
   * Sertifikat kelas: semua pelajaran selesai + skor kuis terbaik minimal sekian persen
   * (jika kelas punya kuis). Nilai ini hanya untuk tampilan — batas sebenarnya
   * ada di fungsi database `certificate_min_percent()`; samakan keduanya.
   */
  certificate: { minQuizPercent: 70 },

  /**
   * Tutor AI ("Tanya AI"). Butuh env ANTHROPIC_API_KEY di server; tanpa itu
   * tombolnya tetap tampil tetapi menjawab "belum diaktifkan".
   * `dailyLimit` = pertanyaan per pengguna per hari (menahan biaya).
   */
  ai: { dailyLimit: 20 },

  /** Saklar fitur. */
  features: {
    threeD: true, // scene 3D di beranda & kartu miring
    darkMode: true,
    reviewForm: true,
    /** Tombol "Lanjutkan dengan Google". Nyalakan HANYA setelah provider Google diaktifkan di Supabase. */
    googleLogin: false,
    /** Tombol WhatsApp mengambang (hanya tampil jika contact.whatsapp diisi). */
    whatsappButton: true,
    /** Tutor AI di halaman pelajaran & pembahasan kuis. */
    tutorAi: true,
  },
} as const;

export type SiteConfig = typeof siteConfig;
