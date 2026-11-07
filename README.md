# JeniusAcademy

Platform belajar online (SD, SMP, SMA, UTBK) — dibangun ulang dengan **Next.js 16** (App Router), TypeScript, Tailwind CSS 4, `next-intl` (multibahasa ID/EN), mode gelap bawaan (tanpa library), dan Three.js (`@react-three/fiber`) untuk aksen 3D.

Situs statis versi lama (HTML/CSS/JS) masih ada di riwayat git, commit `2614882`.

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:3000  (otomatis redirect ke /id)
npm run build && npm start
npm run lint
```

Butuh Node.js ≥ 20.9.

## Yang bisa dikonfigurasi (tanpa menyentuh komponen)

| Ingin mengubah… | Edit file |
|---|---|
| Nama, **logo**, warna brand, kontak, sosial media, statistik, saklar fitur (3D, mode gelap, form ulasan), bahasa yang tersedia | [`src/config/site.ts`](src/config/site.ts) |
| Jenjang, **harga**, mata pelajaran, kelas, pelajaran, pengajar, ID video YouTube | [`src/config/courses.ts`](src/config/courses.ts) |
| Ulasan awal | [`src/config/reviews.ts`](src/config/reviews.ts) |
| Semua teks antarmuka | [`messages/id.json`](messages/id.json), [`messages/en.json`](messages/en.json) |

- **Logo:** taruh file di `public/brand/`, isi `siteConfig.logo.src`. Kosong = wordmark teks.
- **Warna brand:** `siteConfig.colors` → diterapkan ke seluruh situs lewat CSS variable. Token lain (netral, mode gelap) ada di `src/app/globals.css`.
- **Bahasa baru:** tambah kode di `locales`/`localeLabels` pada `site.ts`, buat `messages/<kode>.json` (salin `en.json`), dan tambahkan teks `<kode>` pada data di `courses.ts`/`reviews.ts`.
- Isi bertanda **PLACEHOLDER** (kontak, pengajar, ulasan, statistik, video, harga) adalah contoh dan harus diganti sebelum rilis.

## Status fitur

- Login/registrasi, progres belajar, dan ulasan masih **mode pratinjau**: data hanya di `localStorage` browser, tidak ada server dan tidak ada kata sandi yang disimpan. Pengganti ada di `src/lib/auth.ts`, `progress.ts`, `user-reviews.ts`.
- Pembayaran belum tersedia.

## Struktur

```
src/app/[locale]/        halaman tipis: hanya merakit komponen + metadata
src/components/
  ui/                    primitif: Icon, Logo, TiltCard, FormField, FilterPills, SectionHeading, ProgressBar, PageHeader
  layout/                Navbar, NavLinkList, AuthActions, Footer, ThemeToggle, LocaleSwitcher, nav-links.ts
  home/                  satu file per section beranda (Hero, Benefits, Levels, Faq, Contact, ...)
  course/                CourseCard, CourseCatalog, CourseHero, CourseMeta, CourseProgress, LessonList, LessonControls
  pricing/               PricingCard
  review/                ReviewCard, ReviewsBoard, ReviewForm
  auth/                  AuthShell, AuthForm, PasswordField, PasswordStrength, GoogleButton
  three/                 Hero3D (loader + fallback), HeroScene (Three.js), SceneFallback
src/config/              konten & konfigurasi (site, courses, reviews)
src/i18n/                routing, navigasi, request config next-intl
src/lib/                 routes, course-utils, validation (murni), hooks, theme, store localStorage, format
src/proxy.ts             deteksi & redirect bahasa
messages/                terjemahan
```

Aturan: path internal selalu lewat `routes` (`src/lib/routes.ts`); validasi dan format ada di `src/lib/` sebagai fungsi murni, komponen hanya menampilkan.
