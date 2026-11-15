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
npm test         # Vitest: validasi (termasuk input CMS), akses langganan, streak, dasbor, kuis/sertifikat, kesesuaian terjemahan ID/EN, redirect aman
```

Butuh Node.js ≥ 20.9.

## Yang bisa dikonfigurasi (tanpa menyentuh komponen)

| Ingin mengubah… | Edit file |
|---|---|
| Nama, **logo**, warna brand, kontak (termasuk **nomor WhatsApp** untuk tombol mengambang & ajakan berlangganan), sosial media, statistik, batas nilai sertifikat, saklar fitur (3D, mode gelap, form ulasan, tombol WhatsApp), bahasa yang tersedia | [`src/config/site.ts`](src/config/site.ts) |
| Jenjang, **harga**, mata pelajaran, kelas, pelajaran, pengajar, video YouTube, soal kuis | **CMS** di `/admin` (lihat **CMS & role**) |
| Ulasan awal | [`src/config/reviews.ts`](src/config/reviews.ts) |
| Semua teks antarmuka | [`messages/id.json`](messages/id.json), [`messages/en.json`](messages/en.json) |

- **Logo:** taruh file di `public/brand/`, isi `siteConfig.logo.src`. Kosong = wordmark teks.
- **Warna brand:** `siteConfig.colors` → diterapkan ke seluruh situs lewat CSS variable. Token lain (netral, mode gelap) ada di `src/app/globals.css`.
- **Bahasa baru:** tambah kode di `locales`/`localeLabels` pada `site.ts`, buat `messages/<kode>.json` (salin `en.json`), dan tambahkan teks `<kode>` di `reviews.ts`. CMS otomatis menampilkan kolom isian untuk bahasa baru.
- Isi bertanda **PLACEHOLDER** (kontak, pengajar, ulasan, statistik, video, harga) adalah contoh dan harus diganti sebelum rilis.

## Backend (Supabase)

Akun, progres belajar, dan ulasan memakai **Supabase** (paket Free cukup).

1. Buat project di supabase.com, lalu salin Project URL dan Publishable key ke `.env` / `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   ```
2. Terapkan skema database: lihat **Migrasi database** di bawah (tabel + RLS + trigger profil ada di `supabase/migrations/`).
3. Authentication → URL Configuration: isi **Site URL** dan tambahkan `http://localhost:3000/**` (serta URL produksi) ke **Redirect URLs**.
4. (Opsional) Login Google: aktifkan provider Google di Authentication → Providers, lalu set `features.googleLogin: true` di `src/config/site.ts` (tombolnya disembunyikan secara default).

Perilaku: tamu menyimpan progres di `localStorage`; setelah login progres masuk ke akun (progres lokal digabung sekali). Ulasan baru berstatus **menunggu persetujuan** — setujui di CMS → Ulasan.
Kode: `src/lib/auth.ts`, `progress.ts`, `user-reviews.ts`, `src/lib/supabase/`, `src/proxy.ts` (bahasa + refresh sesi), `src/app/[locale]/auth/callback`.

Storage (dibuat otomatis oleh migration `*_learning_features.sql`): bucket publik `avatars` (foto profil, maks. 2 MB) dan bucket privat `materials` (file materi pelajaran, maks. 20 MB).

## Langganan & akses berbayar

Pembayaran online **belum** ada. Alurnya manual:

1. Jenjang dengan harga > 0 (CMS → Jenjang & harga) adalah jenjang berbayar.
2. Siswa menekan **Berlangganan** → terbuka WhatsApp (jika `contact.whatsapp` diisi), atau email, atau bagian kontak.
3. Setelah siswa membayar, super admin membuka **CMS → Langganan**, memilih pengguna, jenjang, dan durasi (1/3/6/12 bulan atau tanpa batas). Memberi akses lagi saat masih aktif = memperpanjang dari tanggal berakhir.

Aturan akses (dijaga di database, fungsi `has_course_access` / `has_lesson_access`):

| Siapa | Bisa membuka |
|---|---|
| Siapa pun, termasuk tamu | semua kelas di jenjang **gratis**; pelajaran bertanda **Pratinjau gratis** di kelas berbayar |
| Pelanggan aktif jenjang itu | semua pelajaran, materi, kuis, dan diskusi kelas di jenjang tersebut |
| Guru pemilik kelas / super admin | kelasnya / semua kelas |

Video, catatan, dan file materi **tidak ada di HTML halaman**: dimuat lewat RPC `lesson_content` hanya jika berhak. Pelajaran pertama setiap kelas otomatis dijadikan pratinjau gratis saat migration diterapkan; ubah di editor pelajaran.

## CMS & role

Konten (jenjang & harga, kelas, pelajaran, soal kuis) disimpan di Supabase dan dikelola di **`/admin`**. Tautan "CMS" muncul di navbar untuk guru dan super admin.

| Role | Bisa |
|---|---|
| `student` (bawaan setiap pendaftar) | belajar, kuis, kirim ulasan |
| `teacher` | membuat & mengedit **kelas miliknya sendiri** (data kelas, pelajaran, materi, kuis, terbit/draf), menjawab diskusi, melihat progres, nilai, dan statistik siswa di kelasnya |
| `super_admin` | semua kelas (termasuk menunjuk guru pemilik), jenjang & harga, langganan, mengubah role pengguna, moderasi ulasan |

- **Super admin pertama** diatur sekali lewat SQL Editor Supabase (setelah akunnya mendaftar):
  ```sql
  update public.profiles set role = 'super_admin'
  where id = (select id from auth.users where email = 'email@anda.com');
  ```
  Setelah itu role lain diatur dari CMS → Pengguna. Super admin tidak bisa menurunkan role-nya sendiri, jadi selalu tersisa minimal satu.
- Izin dijaga di database (RLS + fungsi `can_edit_course`, `set_user_role`, `admin_list_users`, `course_student_report` di migration `*_cms_roles.sql`), bukan hanya di tampilan.
- Halaman publik dibangun statis dan diperbarui otomatis saat CMS menyimpan (paling lambat 5 menit). Kelas draf dan kelas tanpa pelajaran tidak tampil.
- `slug` kelas dan ID pelajaran tidak bisa diubah setelah dibuat karena dipakai progres siswa.
- Editor pelajaran: catatan/ringkasan, file materi (unggah langsung ke Storage), centang **Pratinjau gratis**, dan urutan pelajaran/soal bisa diubah dengan **drag-and-drop** (pegangan ⋮⋮, di layar lebar) atau tombol ↑/↓.
- **Statistik** (`/admin/stats`): siswa, tuntas, rata-rata kuis, sertifikat per kelas, dan jumlah siswa per pelajaran untuk melihat di mana siswa berhenti. Super admin juga melihat ringkasan situs.
- **Diskusi** (`/admin/discussions`) dan **Langganan** (`/admin/subscriptions`, super admin).
- Kode: `src/app/[locale]/admin/`, `src/components/admin/`, `src/lib/cms/` (validasi murni + tes, server action, kueri), `src/lib/content-server.ts` (baca konten publik).

## Kuis, sertifikat & dasbor

- **Kuis** per kelas: soal pilihan ganda dikelola di CMS. Kunci jawaban **tidak** dikirim ke browser; jawaban dinilai di server (RPC `submit_quiz`), yang juga mencatat skor ke `quiz_attempts`. Siswa tidak bisa menulis skornya sendiri. Kunci & pembahasan tampil setelah jawaban diserahkan, jadi siswa tetap bisa mengulang kuis dengan jawaban yang sudah ia lihat.
- Tamu bisa mengerjakan kuis kelas gratis; skornya hanya disimpan di perangkat dan **tidak** dipindahkan ke akun saat login (skor dari browser tidak bisa dipercaya).
- **Sertifikat**: muncul di halaman kelas setelah semua pelajaran selesai dan skor kuis terbaik ≥ 70% (jika kelas punya kuis). Syarat diperiksa di database (`claim_certificate`); batasnya di fungsi `certificate_min_percent()` — samakan dengan `siteConfig.certificate.minQuizPercent`. Halaman verifikasi publik: `/certificates/<kode>`; tombol **Cetak / simpan PDF** memakai dialog cetak browser.
- **Dasbor** di `/dashboard`: streak harian, target pelajaran per minggu, pelajaran selesai, kelas berjalan/tuntas, rata-rata skor kuis, langganan, sertifikat, riwayat kuis. Perhitungan ada di `src/lib/dashboard.ts` dan `src/lib/activity.ts` (fungsi murni, dites).
- **Profil** di `/profile`: nama, foto, target mingguan, daftar sertifikat, ubah kata sandi.
- **Diskusi** di setiap pelajaran: siswa yang berhak bisa bertanya dan membalas; jawaban guru diberi label. Pertanyaan yang belum dijawab guru muncul di CMS → Diskusi.

## Migrasi database

Skema database ada di `supabase/migrations/` (file SQL berversi, satu perubahan = satu file baru). **Jangan ubah tabel lewat dashboard** dan jangan mengedit migration yang sudah diterapkan — tulis migration baru:

```bash
npx supabase@3.1.0 migration new nama_perubahan   # membuat supabase/migrations/<waktu>_nama_perubahan.sql
```

**Menerapkan manual** (sekali, atau untuk lingkungan lain):

```bash
npx supabase@3.1.0 login
npx supabase@3.1.0 link --project-ref <PROJECT_REF>     # minta password database
npx supabase@3.1.0 db push --remote --dry-run            # lihat yang akan diterapkan
npx supabase@3.1.0 db push --remote
```

**Otomatis lewat CI:** job `migrate` di `.github/workflows/ci.yml` menjalankan `db push` setiap push ke `main` setelah lint/typecheck/test/build lolos. Aktifkan dengan mengisi di GitHub → Settings → Secrets and variables → Actions:

| Jenis | Nama | Isi |
|---|---|---|
| Variable | `SUPABASE_PROJECT_REF` | ID project (bagian `xxxx` dari `xxxx.supabase.co`) — **mengaktifkan job** |
| Secret | `SUPABASE_ACCESS_TOKEN` | token dari supabase.com/dashboard/account/tokens |
| Secret | `SUPABASE_DB_PASSWORD` | password database project |

Catatan: migration `20261115000000_learning_features.sql` **tidak** kompatibel ke belakang: kolom video/catatan pelajaran dan kunci jawaban kuis tidak lagi bisa dibaca langsung, sehingga aplikasi versi sebelumnya gagal memuat kelas. Terapkan bersamaan dengan deploy aplikasi yang menyertainya (halaman yang sudah di-cache tetap tampil selama jeda).

Migration berjalan terpisah dari deploy aplikasi, jadi tulis perubahan yang **kompatibel ke belakang** (tambah kolom/tabel dulu, hapus yang lama di rilis berikutnya). Migration yang sudah diterapkan tidak bisa di-undo otomatis; paket Free tidak punya backup otomatis, jadi ekspor data sebelum perubahan destruktif.

## SEO

- `sitemap.xml`, `robots.txt`, canonical + hreflang per halaman, JSON-LD (`EducationalOrganization`, `Course`), dan gambar OG dinamis (`/[locale]/opengraph-image`).
- **Set domain produksi** lewat env `NEXT_PUBLIC_SITE_URL=https://domain-anda.com` (default `https://example.com`), kalau tidak, sitemap/canonical menunjuk ke domain contoh.
- Halaman login/daftar/reset dan CMS diberi `noindex`; `/admin` juga dikecualikan di `robots.txt`.

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
  admin/                 CMS: CourseForm, LessonsEditor, QuizEditor, LevelsEditor, UsersTable, ReviewsModeration
  auth/                  AuthShell, AuthForm, PasswordField, PasswordStrength, GoogleButton
  three/                 Hero3D (loader + fallback), HeroScene (Three.js), SceneFallback
src/config/              konfigurasi situs + ulasan awal (konten kelas ada di database)
src/i18n/                routing, navigasi, request config next-intl
src/lib/                 routes, content (tipe), content-server, cms/, course-utils, validation (murni), hooks, theme, store localStorage, format
src/proxy.ts             deteksi & redirect bahasa
messages/                terjemahan
```

Aturan: path internal selalu lewat `routes` (`src/lib/routes.ts`); validasi dan format ada di `src/lib/` sebagai fungsi murni, komponen hanya menampilkan.
