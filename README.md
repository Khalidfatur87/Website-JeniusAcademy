# JeniusAcademy

Platform belajar online (SD, SMP, SMA, UTBK) — dibangun ulang dengan **Next.js 16** (App Router), TypeScript, Tailwind CSS 4, `next-intl` (multibahasa ID/EN), mode gelap bawaan (tanpa library), dan Three.js (`@react-three/fiber`) untuk aksen 3D.

Situs statis versi lama (HTML/CSS/JS) masih ada di riwayat git, commit `2614882`.

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:3000  (otomatis redirect ke /id)
npm run build && npm start
npm run lint
npm run typecheck
npm test         # Vitest: validasi, data kelas, kesesuaian terjemahan ID/EN, redirect aman
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

## Backend (Supabase)

Akun, progres belajar, dan ulasan memakai **Supabase** (paket Free cukup).

1. Buat project di supabase.com, lalu salin Project URL dan Publishable key ke `.env` / `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   ```
2. Jalankan [`supabase/schema.sql`](supabase/schema.sql) di Dashboard → SQL Editor (tabel + RLS + trigger profil).
3. Authentication → URL Configuration: isi **Site URL** dan tambahkan `http://localhost:3000/**` (serta URL produksi) ke **Redirect URLs**.
4. (Opsional) Login Google: aktifkan provider Google di Authentication → Providers, lalu set `features.googleLogin: true` di `src/config/site.ts` (tombolnya disembunyikan secara default).

Perilaku: tamu menyimpan progres di `localStorage`; setelah login progres masuk ke akun (progres lokal digabung sekali). Ulasan baru berstatus **menunggu persetujuan** — setujui dengan `update public.reviews set approved = true where id = ...`.
Kode: `src/lib/auth.ts`, `progress.ts`, `user-reviews.ts`, `src/lib/supabase/`, `src/proxy.ts` (bahasa + refresh sesi), `src/app/[locale]/auth/callback`.

Pembayaran belum tersedia.

## SEO

- `sitemap.xml`, `robots.txt`, canonical + hreflang per halaman, JSON-LD (`EducationalOrganization`, `Course`), dan gambar OG dinamis (`/[locale]/opengraph-image`).
- **Set domain produksi** lewat env `NEXT_PUBLIC_SITE_URL=https://domain-anda.com` (default `https://example.com`), kalau tidak, sitemap/canonical menunjuk ke domain contoh.
- Halaman login/daftar/reset diberi `noindex`.

## CI

`.github/workflows/ci.yml` menjalankan lint, typecheck, test, dan build di setiap push/PR.

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
