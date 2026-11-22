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

  @override
  String get markDone => 'Tandai selesai';

  @override
  String get markUndone => 'Tandai belum selesai';

  @override
  String get nextLesson => 'Pelajaran berikutnya';

  @override
  String get previousLesson => 'Sebelumnya';

  @override
  String get finishedCourse => 'Kelas selesai';

  @override
  String get completed => 'Selesai';

  @override
  String get lessonNotes => 'Catatan pelajaran';

  @override
  String get lessonMaterials => 'Materi pendukung';

  @override
  String get downloadFailed => 'File tidak bisa dibuka. Coba lagi.';

  @override
  String get videoUnavailable => 'Video untuk pelajaran ini belum tersedia.';

  @override
  String get saveFailed => 'Gagal menyimpan. Periksa koneksi lalu coba lagi.';

  @override
  String get lockedTitle => 'Pelajaran ini khusus pelanggan';

  @override
  String get lockedText =>
      'Video, catatan, dan materi pelajaran ini terbuka untuk pelanggan paket jenjangnya. Pelajaran bertanda Gratis bisa ditonton tanpa berlangganan.';

  @override
  String get openOnWebsite => 'Lihat di website';

  @override
  String completedOf(int done, int total) {
    return '$done dari $total pelajaran selesai';
  }

  @override
  String get startCourse => 'Mulai belajar';

  @override
  String get resumeCourse => 'Lanjutkan belajar';

  @override
  String get reviewCourse => 'Ulangi kelas';

  @override
  String get lessonList => 'Daftar pelajaran';

  @override
  String get next => 'Berikutnya';

  @override
  String get quizTitle => 'Kuis';

  @override
  String get takeQuiz => 'Kerjakan kuis';

  @override
  String get retakeQuiz => 'Ulangi kuis';

  @override
  String quizBest(int score, int total) {
    return 'Skor terbaik: $score/$total';
  }

  @override
  String quizCount(int count) {
    return '$count soal latihan';
  }

  @override
  String questionNumber(int number) {
    return 'Soal $number';
  }

  @override
  String quizProgress(int answered, int total) {
    return '$answered dari $total soal terjawab';
  }

  @override
  String get checkAnswers => 'Periksa jawaban';

  @override
  String get correct => 'Benar';

  @override
  String get wrong => 'Salah';

  @override
  String get explanation => 'Pembahasan';

  @override
  String get yourScore => 'Skor kamu';

  @override
  String scoreLine(int score, int total) {
    return '$score dari $total benar';
  }

  @override
  String get verdictGreat => 'Sempurna! Kamu menguasai materi ini.';

  @override
  String get verdictGood => 'Bagus! Tinggal sedikit lagi.';

  @override
  String get verdictReview => 'Yuk tinjau lagi materinya, lalu coba lagi.';

  @override
  String get backToCourse => 'Kembali ke kelas';

  @override
  String get submitFailed =>
      'Jawaban gagal dikirim. Periksa koneksi lalu coba lagi.';

  @override
  String get quizNoAccess => 'Kuis ini khusus pelanggan paket jenjangnya.';

  @override
  String get certificateTitle => 'Sertifikat';

  @override
  String get viewCertificate => 'Lihat sertifikat';

  @override
  String get claimCertificate => 'Ambil sertifikat';

  @override
  String reqLessons(int done, int total) {
    return 'Selesaikan semua pelajaran ($done/$total)';
  }

  @override
  String reqQuiz(int percent) {
    return 'Raih skor kuis minimal $percent%';
  }

  @override
  String get certNotComplete => 'Selesaikan semua pelajaran terlebih dahulu.';

  @override
  String certQuizRequired(int percent) {
    return 'Skor kuis terbaikmu belum mencapai $percent%.';
  }

  @override
  String get certNoAccess => 'Kamu belum punya akses ke kelas ini.';

  @override
  String get certGeneric => 'Sertifikat gagal dibuat. Coba lagi.';

  @override
  String get certHeading => 'Sertifikat Penyelesaian';

  @override
  String get presentedTo => 'Diberikan kepada';

  @override
  String get forCompleting => 'atas keberhasilan menyelesaikan kelas';

  @override
  String certQuizScore(int score, int total, int percent) {
    return 'Skor kuis: $score/$total ($percent%)';
  }

  @override
  String get issuedOn => 'Tanggal terbit';

  @override
  String get certCode => 'Kode sertifikat';

  @override
  String get printOnWebsite => 'Cetak / simpan PDF di website';

  @override
  String get copyVerifyLink => 'Salin tautan verifikasi';

  @override
  String get linkCopied => 'Tautan disalin';

  @override
  String get myCertificates => 'Sertifikat saya';

  @override
  String get noCertificates =>
      'Belum ada sertifikat. Selesaikan kelas untuk mendapatkannya.';

  @override
  String get editName => 'Ubah nama';

  @override
  String get save => 'Simpan';

  @override
  String get cancel => 'Batal';

  @override
  String get changePhoto => 'Ganti foto';

  @override
  String get choosePhoto => 'Pilih dari galeri';

  @override
  String get removePhoto => 'Hapus foto';

  @override
  String get weeklyGoal => 'Target mingguan';

  @override
  String weeklyGoalValue(int count) {
    return '$count pelajaran per minggu';
  }

  @override
  String get showOnLeaderboard => 'Tampilkan nama di peringkat';

  @override
  String get showOnLeaderboardHint =>
      'Jika dimatikan, namamu tidak terlihat oleh siswa lain.';

  @override
  String get errNameRequired => 'Nama wajib diisi.';

  @override
  String get errNameTooLong => 'Nama maksimal 80 karakter.';

  @override
  String get errFileType => 'Gunakan foto PNG, JPG, atau WEBP.';

  @override
  String get errFileSize => 'Ukuran foto maksimal 2 MB.';

  @override
  String get saved => 'Tersimpan';

  @override
  String get practiceTitle => 'Latihan pintar';

  @override
  String get practiceSubtitle =>
      'Soal kuis yang pernah salah muncul lagi di waktu yang tepat sampai kamu menguasainya.';

  @override
  String practiceDue(int count) {
    return '$count soal siap diulang';
  }

  @override
  String get practiceIntro =>
      'Satu sesi berisi sampai 10 soal. Benar → muncul lagi beberapa hari kemudian; salah → besok.';

  @override
  String get practiceNothingDue => 'Tidak ada soal untuk diulang sekarang';

  @override
  String get practiceNothingTracked =>
      'Kerjakan kuis di kelas mana pun. Soal yang salah otomatis masuk ke sini.';

  @override
  String practiceNextDue(String date) {
    return 'Soal berikutnya muncul $date.';
  }

  @override
  String get practiceBrowse => 'Jelajahi kelas';

  @override
  String get practiceStart => 'Mulai latihan';

  @override
  String get practiceAgain => 'Latihan lagi';

  @override
  String practiceProgress(int current, int total) {
    return 'Soal $current dari $total';
  }

  @override
  String get practiceCheck => 'Periksa';

  @override
  String get practiceCorrect => 'Benar!';

  @override
  String get practiceWrong => 'Belum tepat.';

  @override
  String get practiceMastered => 'Dikuasai! Soal ini keluar dari antrean.';

  @override
  String get practiceDone => 'Sesi selesai';

  @override
  String practiceScore(int correct, int total) {
    return '$correct dari $total benar.';
  }

  @override
  String practiceMasteredCount(int count) {
    return '$count soal dikuasai.';
  }

  @override
  String get tryoutTitle => 'Try-out UTBK';

  @override
  String get tryoutSubtitle =>
      'Latihan ujian bertimer per subtes, lengkap dengan skor, peringkat, dan pembahasan.';

  @override
  String get tryoutEmpty => 'Belum ada try-out yang dibuka.';

  @override
  String tryoutSectionCount(int count) {
    return '$count subtes';
  }

  @override
  String tryoutTotalTime(int count) {
    return 'Total waktu $count menit';
  }

  @override
  String tryoutOpensAt(String date) {
    return 'Dibuka $date';
  }

  @override
  String tryoutClosesAt(String date) {
    return 'Ditutup $date';
  }

  @override
  String get tryoutWindowOpen => 'Dibuka';

  @override
  String get tryoutWindowUpcoming => 'Segera dibuka';

  @override
  String get tryoutWindowClosed => 'Sudah ditutup';

  @override
  String get tryoutSections => 'Subtes';

  @override
  String get tryoutRule1 =>
      'Subtes dikerjakan berurutan dengan waktu masing-masing; subtes yang sudah lewat tidak bisa dibuka lagi.';

  @override
  String get tryoutRule2 =>
      'Jawaban tersimpan otomatis. Jika koneksi terputus, buka lagi try-out ini untuk melanjutkan.';

  @override
  String get tryoutRule3 =>
      'Waktu habis = jawaban otomatis diserahkan. Hanya satu kali percobaan yang dihitung untuk peringkat.';

  @override
  String get tryoutStart => 'Mulai try-out';

  @override
  String get tryoutContinue => 'Lanjutkan try-out';

  @override
  String get tryoutDone => 'Selesai';

  @override
  String get tryoutOneAttempt =>
      'Kamu hanya punya satu kesempatan. Pastikan koneksi stabil sebelum mulai.';

  @override
  String tryoutSectionOf(int current, int total) {
    return 'Subtes $current dari $total';
  }

  @override
  String tryoutAnsweredOf(int answered, int total) {
    return '$answered dari $total terjawab';
  }

  @override
  String get tryoutSaving => 'Menyimpan…';

  @override
  String get tryoutSaved => 'Tersimpan';

  @override
  String get tryoutSaveFailed => 'Gagal menyimpan, akan dicoba lagi';

  @override
  String get tryoutNextSection => 'Lanjut subtes berikutnya';

  @override
  String get tryoutSubmit => 'Serahkan jawaban';

  @override
  String tryoutConfirmNext(int count) {
    return 'Lanjut ke subtes berikutnya? Kamu tidak bisa kembali ke subtes ini. Soal kosong: $count.';
  }

  @override
  String tryoutConfirmSubmit(int count) {
    return 'Serahkan semua jawaban sekarang? Jawaban tidak bisa diubah lagi. Soal kosong: $count.';
  }

  @override
  String get tryoutSubmitting => 'Menyerahkan jawaban…';

  @override
  String get tryoutErrNoAccess =>
      'Try-out ini termasuk paket berbayar. Berlangganan untuk mengerjakannya.';

  @override
  String get tryoutErrClosed => 'Try-out ini sedang tidak dibuka.';

  @override
  String get tryoutErrNotSignedIn => 'Masuk dulu untuk mengerjakan try-out.';

  @override
  String get tryoutErrGeneric => 'Try-out gagal dimuat. Coba lagi.';

  @override
  String get tryoutYourResult => 'Hasil kamu';

  @override
  String tryoutRank(int rank, int participants) {
    return 'Peringkat $rank dari $participants';
  }

  @override
  String get tryoutFocus => 'Perlu dipelajari lagi';

  @override
  String get tryoutAllGood => 'Semua subtes sudah bagus. Pertahankan!';

  @override
  String get tryoutPerSection => 'Skor per subtes';

  @override
  String tryoutAverage(int percent) {
    return 'rata-rata peserta $percent%';
  }

  @override
  String get tryoutReview => 'Pembahasan';

  @override
  String get tryoutUnanswered => 'Tidak dijawab';

  @override
  String get tryoutLeaderboard => 'Peringkat peserta';

  @override
  String get tryoutLeaderboardEmpty =>
      'Belum ada peserta yang menyerahkan jawaban.';

  @override
  String get tryoutHiddenName => 'Peserta';

  @override
  String get tryoutYou => 'kamu';

  @override
  String tryoutSubmittedOn(String date) {
    return 'Diserahkan $date';
  }

  @override
  String get continueAction => 'Lanjut';

  @override
  String get quickLinks => 'Fitur lainnya';

  @override
  String get liveTitle => 'Kelas live';

  @override
  String get classesTitle => 'Kelas sekolah';

  @override
  String get discussionTitle => 'Diskusi';

  @override
  String get discussionAsk => 'Tulis pertanyaanmu tentang pelajaran ini…';

  @override
  String get discussionReplyHint => 'Tulis jawaban…';

  @override
  String get discussionReply => 'Balas';

  @override
  String get discussionEmpty =>
      'Belum ada pertanyaan. Jadilah yang pertama bertanya.';

  @override
  String get discussionFailed => 'Gagal mengirim. Coba lagi.';

  @override
  String get discussionDelete => 'Hapus';

  @override
  String get discussionConfirmDelete => 'Hapus tulisan ini?';

  @override
  String get discussionTeacher => 'Pengajar';

  @override
  String discussionReplyingTo(String name) {
    return 'Membalas $name';
  }

  @override
  String get discussionOpen => 'Diskusi pelajaran';

  @override
  String get send => 'Kirim';

  @override
  String get liveSubtitle =>
      'Belajar langsung bersama pengajar. Rekamannya bisa ditonton lagi.';

  @override
  String get liveUpcoming => 'Jadwal mendatang';

  @override
  String get liveNoUpcoming => 'Belum ada jadwal kelas live.';

  @override
  String get livePast => 'Rekaman sebelumnya';

  @override
  String liveHost(String name) {
    return 'Bersama $name';
  }

  @override
  String get livePhaseUpcoming => 'Akan datang';

  @override
  String get livePhaseSoon => 'Segera dimulai';

  @override
  String get livePhaseLive => 'Sedang berlangsung';

  @override
  String get livePhaseEnded => 'Selesai';

  @override
  String get liveAddToCalendar => 'Tambah ke kalender';

  @override
  String get liveJoin => 'Masuk kelas live';

  @override
  String get liveLinkLater =>
      'Tombol masuk muncul 15 menit sebelum kelas dimulai.';

  @override
  String get liveLocked => 'Kelas live ini khusus pelanggan paket jenjangnya.';

  @override
  String get liveRecording => 'Rekaman';

  @override
  String get liveNoRecording => 'Rekaman belum tersedia.';

  @override
  String get classesSubtitle =>
      'Gabung kelas dari gurumu dan kerjakan tugasnya di sini.';

  @override
  String get classesCode => 'Kode kelas dari guru';

  @override
  String get classesJoin => 'Gabung';

  @override
  String classesJoined(String name) {
    return 'Berhasil bergabung ke $name.';
  }

  @override
  String get classesErrInvalid => 'Kode kelas tidak ditemukan.';

  @override
  String get classesErrOwn => 'Kamu guru di kelas ini.';

  @override
  String get classesErrGeneric => 'Gagal bergabung. Coba lagi.';

  @override
  String get classesTodo => 'Tugas';

  @override
  String get classesDone => 'Selesai';

  @override
  String get classesNoTasks => 'Belum ada tugas.';

  @override
  String get classesAllDone => 'Semua tugas sudah selesai. Mantap!';

  @override
  String get classesKindLesson => 'Tonton pelajaran';

  @override
  String get classesKindQuiz => 'Kerjakan kuis';

  @override
  String get classesKindCourse => 'Selesaikan kelas';

  @override
  String classesDue(String date) {
    return 'Tenggat $date';
  }

  @override
  String classesOverdue(String date) {
    return 'Lewat tenggat $date';
  }

  @override
  String get classesNoDue => 'Tanpa tenggat';

  @override
  String classesScore(int percent) {
    return 'nilai $percent%';
  }

  @override
  String get classesStart => 'Kerjakan';

  @override
  String get classesOpen => 'Buka';

  @override
  String get classesMine => 'Kelas yang diikuti';

  @override
  String get classesLeave => 'Keluar';

  @override
  String classesConfirmLeave(String name) {
    return 'Keluar dari kelas $name?';
  }
}
