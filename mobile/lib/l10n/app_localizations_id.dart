// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Indonesian (`id`).
class AppLocalizationsId extends AppLocalizations {
  AppLocalizationsId([String locale = 'id']) : super(locale);

  @override
  String get appName => 'JeniusAcademy';

  @override
  String get tabHome => 'Beranda';

  @override
  String get tabCourses => 'Kelas';

  @override
  String get tabPractice => 'Latihan';

  @override
  String get tabLeaderboard => 'Peringkat';

  @override
  String get tabProfile => 'Profil';

  @override
  String get email => 'Email';

  @override
  String get password => 'Kata sandi';

  @override
  String get name => 'Nama lengkap';

  @override
  String get login => 'Masuk';

  @override
  String get register => 'Daftar';

  @override
  String get logout => 'Keluar';

  @override
  String get loginTitle => 'Selamat datang kembali';

  @override
  String get loginSubtitle => 'Masuk untuk melanjutkan belajar.';

  @override
  String get registerTitle => 'Buat akun';

  @override
  String get registerSubtitle => 'Gratis, cukup satu menit.';

  @override
  String get forgotPassword => 'Lupa kata sandi?';

  @override
  String get forgotTitle => 'Atur ulang kata sandi';

  @override
  String get forgotSubtitle =>
      'Kami kirim tautan ke email Anda. Kata sandi baru dibuat di website.';

  @override
  String get sendLink => 'Kirim tautan';

  @override
  String get linkSent => 'Tautan sudah dikirim. Periksa email Anda.';

  @override
  String get noAccount => 'Belum punya akun? Daftar';

  @override
  String get haveAccount => 'Sudah punya akun? Masuk';

  @override
  String get checkEmail =>
      'Akun dibuat. Buka email Anda untuk konfirmasi, lalu masuk.';

  @override
  String get errRequired => 'Wajib diisi';

  @override
  String get errEmail => 'Email tidak valid';

  @override
  String get errPasswordShort => 'Minimal 8 karakter';

  @override
  String get errInvalidCredentials => 'Email atau kata sandi salah.';

  @override
  String get errEmailNotConfirmed =>
      'Email belum dikonfirmasi. Periksa kotak masuk Anda.';

  @override
  String get errAlreadyRegistered => 'Email ini sudah terdaftar.';

  @override
  String get errWeakPassword => 'Kata sandi terlalu lemah.';

  @override
  String get errRateLimited =>
      'Terlalu banyak percobaan. Coba lagi sebentar lagi.';

  @override
  String get errGeneric => 'Terjadi kesalahan. Periksa koneksi lalu coba lagi.';

  @override
  String get retry => 'Coba lagi';

  @override
  String hello(String name) {
    return 'Halo, $name!';
  }

  @override
  String levelLabel(int level) {
    return 'Level $level';
  }

  @override
  String xpToNext(int current, int needed) {
    return '$current/$needed XP ke level berikutnya';
  }

  @override
  String get xpWeek => 'XP minggu ini';

  @override
  String get lessonsDone => 'Pelajaran selesai';

  @override
  String get bestStreak => 'Streak terbaik';

  @override
  String days(int count) {
    return '$count hari';
  }

  @override
  String get badgesTitle => 'Lencana';

  @override
  String get coursesTitle => 'Kelas';

  @override
  String get allLevels => 'Semua';

  @override
  String get noCourses => 'Belum ada kelas.';

  @override
  String teacher(String name) {
    return 'Pengajar: $name';
  }

  @override
  String lessonCount(int count) {
    return '$count pelajaran';
  }

  @override
  String minutes(int count) {
    return '$count menit';
  }

  @override
  String get freePreview => 'Gratis';

  @override
  String get comingSoon => 'Segera hadir';

  @override
  String get comingSoonBody =>
      'Fitur ini sedang dibuat. Sementara itu, gunakan versi website.';

  @override
  String get language => 'Bahasa';

  @override
  String get notConfiguredTitle => 'Aplikasi belum dikonfigurasi';

  @override
  String get notConfiguredBody =>
      'Jalankan dengan --dart-define-from-file=env.json (salin dari env.example.json, isi URL dan kunci Supabase).';

  @override
  String get badgeFirstLesson => 'Langkah pertama';

  @override
  String get badgeFirstLessonHow => 'Selesaikan 1 pelajaran';

  @override
  String get badgeTenLessons => 'Rajin belajar';

  @override
  String get badgeTenLessonsHow => 'Selesaikan 10 pelajaran';

  @override
  String get badgeFiftyLessons => 'Pembelajar sejati';

  @override
  String get badgeFiftyLessonsHow => 'Selesaikan 50 pelajaran';

  @override
  String get badgePerfectQuiz => 'Nilai sempurna';

  @override
  String get badgePerfectQuizHow => 'Dapat skor 100% di satu kuis';

  @override
  String get badgeStreak7 => 'Seminggu penuh';

  @override
  String get badgeStreak7How => 'Belajar 7 hari berturut-turut';

  @override
  String get badgeStreak30 => 'Sebulan penuh';

  @override
  String get badgeStreak30How => 'Belajar 30 hari berturut-turut';

  @override
  String get badgeFirstCertificate => 'Lulus kelas';

  @override
  String get badgeFirstCertificateHow => 'Dapatkan sertifikat pertama';

  @override
  String get badgeThreeCertificates => 'Kolektor sertifikat';

  @override
  String get badgeThreeCertificatesHow => 'Dapatkan 3 sertifikat';

  @override
  String get badgeTryoutTaker => 'Pejuang try-out';

  @override
  String get badgeTryoutTakerHow => 'Serahkan 1 try-out';

  @override
  String get badgePractice50 => 'Tak kenal menyerah';

  @override
  String get badgePractice50How => 'Jawab benar 50 soal latihan';

  @override
  String get allTime => 'Sepanjang waktu';
}
