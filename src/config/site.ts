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
   * LOGO (PLACEHOLDER)
   * Letakkan file logo di /public/brand lalu isi `src`,
   * mis. "/brand/logo.svg". Jika null, wordmark teks dipakai.
   */
  logo: { src: null as string | null, width: 160, height: 40 },

  /** Domain produksi, dipakai untuk metadata/SEO. PLACEHOLDER. */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com",

  /** Warna brand. Diterapkan ke seluruh situs lewat CSS variable. */
  colors: {
    primary: "#0085FF",
    accent: "#FFB020",
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

  /** Saklar fitur. */
  features: {
    threeD: true, // scene 3D di beranda & kartu miring
    darkMode: true,
    reviewForm: true,
    /** Tombol "Lanjutkan dengan Google". Nyalakan HANYA setelah provider Google diaktifkan di Supabase. */
    googleLogin: false,
  },
} as const;

export type SiteConfig = typeof siteConfig;
