# Rencana Aplikasi Mobile JeniusAcademy

Status: **Fase 1 (MVP) selesai di kode** — menunggu uji dengan data asli di perangkat. Kerangka aplikasi ada di [`mobile/`](../mobile/README.md).

## Keputusan

| Hal | Keputusan |
|---|---|
| Teknologi | **Flutter** (Dart), Riverpod, go_router, supabase_flutter |
| Platform | **Android dulu**, dibagikan sebagai APK (belum ke Play Store) |
| Package name | `com.jeniusacademy.app` |
| Repo | Satu repo dengan website, folder `mobile/` |
| Backend | Supabase yang sama dengan website (RLS, RPC, migration di `supabase/migrations/`) |
| Biaya | **Gratis dulu**: Supabase Free, Firebase Spark, Vercel Hobby, GitHub Actions |
| Login | Email + kata sandi dulu; Google menyusul |
| Pembayaran | Tidak ada tombol beli di aplikasi; langganan tetap lewat website/WhatsApp |
| CMS (`/admin`) | Tetap di website |

## Fase

### Fase 0 — Persiapan
- [x] Proyek Flutter `mobile/`, package `com.jeniusacademy.app`, ikon brand
- [x] Tema warna brand (terang/gelap), bahasa ID/EN (ARB)
- [x] Koneksi Supabase, login/daftar/lupa sandi
- [x] Firebase opsional (build tetap jalan tanpa `google-services.json`)
- [x] Signing release dari `key.properties` / GitHub Secrets
- [x] CI: analyze, test, build APK (`.github/workflows/mobile.yml`)
- [x] Kasus uji bersama web ↔ aplikasi (`shared/fixtures/`), mulai dari gamifikasi
- [x] `google-services.json` dari Firebase (project `jeniusacademymobile`)
- [x] Variabel Supabase di GitHub Actions
- [ ] Keystore di GitHub Actions (opsional)

### Fase 1 — MVP
- [x] Beranda: level, XP, streak, lencana
- [x] Katalog & detail kelas, leaderboard
- [x] Pemutar pelajaran (YouTube + catatan via RPC `lesson_content`), materi, tandai selesai,
      progres kelas & tombol "Lanjutkan belajar" (tabel `lesson_progress`, sama dengan website)
- [x] Kuis (RPC `submit_quiz`, dinilai server) dan sertifikat (`claim_certificate`;
      cetak/PDF lewat halaman verifikasi website, daftar sertifikat di Profil)
- [x] Push pengingat harian: migration `device_tokens` + kirim FCM dari cron `daily-reminder`
      (aktif setelah merge ke main dan `FIREBASE_SERVICE_ACCOUNT` diisi di Vercel)
- [x] Simpan pilihan bahasa, ubah nama/foto profil, target mingguan, tampil di peringkat

### Fase 2 — Fitur lengkap
- [x] Try-out UTBK (timer dari server, simpan otomatis, aman saat aplikasi ke background, hasil, pembahasan, peringkat)
- [x] Latihan pintar (Leitner 1-2-4-7-14 hari, RPC practice_queue/answer_practice)
- [x] Diskusi pelajaran (tanya jawab, balasan satu tingkat, label pengajar, hapus)
- [x] Kelas live (jadwal, tambah ke Google Calendar, tombol masuk dari server 15 menit sebelum mulai, rekaman)
- [x] Mode sekolah (gabung kode, tugas & tenggat, status dari server, keluar kelas)
- [x] Tutor AI: panel Tanya AI & "Jelaskan dengan AI"; `/api/tutor` menerima `Authorization: Bearer`
      (tetap mati: `AppConfig.tutorAi = false`; aktifkan bersama `ANTHROPIC_API_KEY` & `TUTOR_AI_MODEL` di Vercel)

### Fase 3 — Khas mobile
- [ ] Unduh materi untuk offline
- [ ] Mode orang tua + push ringkasan mingguan
- [ ] Widget streak di layar utama
- [ ] Login Google

### Fase 4 — Play Store (nanti, berbayar $25)
- Akun Play Console (akun pribadi baru: closed testing 12 penguji × 14 hari)
- Kebijakan privasi, Data Safety, aturan aplikasi anak, hapus akun dari aplikasi

## Risiko

- **Dua kode (TypeScript & Dart).** Mitigasi: kasus uji bersama di `shared/fixtures/`, aturan penting di database.
- **Migration harus kompatibel ke belakang.** APK versi lama tetap terpasang di HP pengguna.
- **Supabase Free dijeda** setelah 7 hari tanpa aktivitas.
- **Data anak**: perlu kebijakan privasi sebelum dibagikan luas.
- **Isi PLACEHOLDER** di `src/config/site.ts` (kontak, domain) harus diganti.
