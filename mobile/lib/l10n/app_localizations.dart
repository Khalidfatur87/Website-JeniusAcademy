import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_id.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('id'),
  ];

  /// No description provided for @appName.
  ///
  /// In id, this message translates to:
  /// **'JeniusAcademy'**
  String get appName;

  /// No description provided for @tabHome.
  ///
  /// In id, this message translates to:
  /// **'Beranda'**
  String get tabHome;

  /// No description provided for @tabCourses.
  ///
  /// In id, this message translates to:
  /// **'Kelas'**
  String get tabCourses;

  /// No description provided for @tabPractice.
  ///
  /// In id, this message translates to:
  /// **'Latihan'**
  String get tabPractice;

  /// No description provided for @tabLeaderboard.
  ///
  /// In id, this message translates to:
  /// **'Peringkat'**
  String get tabLeaderboard;

  /// No description provided for @tabProfile.
  ///
  /// In id, this message translates to:
  /// **'Profil'**
  String get tabProfile;

  /// No description provided for @email.
  ///
  /// In id, this message translates to:
  /// **'Email'**
  String get email;

  /// No description provided for @password.
  ///
  /// In id, this message translates to:
  /// **'Kata sandi'**
  String get password;

  /// No description provided for @name.
  ///
  /// In id, this message translates to:
  /// **'Nama lengkap'**
  String get name;

  /// No description provided for @login.
  ///
  /// In id, this message translates to:
  /// **'Masuk'**
  String get login;

  /// No description provided for @register.
  ///
  /// In id, this message translates to:
  /// **'Daftar'**
  String get register;

  /// No description provided for @logout.
  ///
  /// In id, this message translates to:
  /// **'Keluar'**
  String get logout;

  /// No description provided for @loginTitle.
  ///
  /// In id, this message translates to:
  /// **'Selamat datang kembali'**
  String get loginTitle;

  /// No description provided for @loginSubtitle.
  ///
  /// In id, this message translates to:
  /// **'Masuk untuk melanjutkan belajar.'**
  String get loginSubtitle;

  /// No description provided for @registerTitle.
  ///
  /// In id, this message translates to:
  /// **'Buat akun'**
  String get registerTitle;

  /// No description provided for @registerSubtitle.
  ///
  /// In id, this message translates to:
  /// **'Gratis, cukup satu menit.'**
  String get registerSubtitle;

  /// No description provided for @forgotPassword.
  ///
  /// In id, this message translates to:
  /// **'Lupa kata sandi?'**
  String get forgotPassword;

  /// No description provided for @forgotTitle.
  ///
  /// In id, this message translates to:
  /// **'Atur ulang kata sandi'**
  String get forgotTitle;

  /// No description provided for @forgotSubtitle.
  ///
  /// In id, this message translates to:
  /// **'Kami kirim tautan ke email Anda. Kata sandi baru dibuat di website.'**
  String get forgotSubtitle;

  /// No description provided for @sendLink.
  ///
  /// In id, this message translates to:
  /// **'Kirim tautan'**
  String get sendLink;

  /// No description provided for @linkSent.
  ///
  /// In id, this message translates to:
  /// **'Tautan sudah dikirim. Periksa email Anda.'**
  String get linkSent;

  /// No description provided for @noAccount.
  ///
  /// In id, this message translates to:
  /// **'Belum punya akun? Daftar'**
  String get noAccount;

  /// No description provided for @haveAccount.
  ///
  /// In id, this message translates to:
  /// **'Sudah punya akun? Masuk'**
  String get haveAccount;

  /// No description provided for @checkEmail.
  ///
  /// In id, this message translates to:
  /// **'Akun dibuat. Buka email Anda untuk konfirmasi, lalu masuk.'**
  String get checkEmail;

  /// No description provided for @errRequired.
  ///
  /// In id, this message translates to:
  /// **'Wajib diisi'**
  String get errRequired;

  /// No description provided for @errEmail.
  ///
  /// In id, this message translates to:
  /// **'Email tidak valid'**
  String get errEmail;

  /// No description provided for @errPasswordShort.
  ///
  /// In id, this message translates to:
  /// **'Minimal 8 karakter'**
  String get errPasswordShort;

  /// No description provided for @errInvalidCredentials.
  ///
  /// In id, this message translates to:
  /// **'Email atau kata sandi salah.'**
  String get errInvalidCredentials;

  /// No description provided for @errEmailNotConfirmed.
  ///
  /// In id, this message translates to:
  /// **'Email belum dikonfirmasi. Periksa kotak masuk Anda.'**
  String get errEmailNotConfirmed;

  /// No description provided for @errAlreadyRegistered.
  ///
  /// In id, this message translates to:
  /// **'Email ini sudah terdaftar.'**
  String get errAlreadyRegistered;

  /// No description provided for @errWeakPassword.
  ///
  /// In id, this message translates to:
  /// **'Kata sandi terlalu lemah.'**
  String get errWeakPassword;

  /// No description provided for @errRateLimited.
  ///
  /// In id, this message translates to:
  /// **'Terlalu banyak percobaan. Coba lagi sebentar lagi.'**
  String get errRateLimited;

  /// No description provided for @errGeneric.
  ///
  /// In id, this message translates to:
  /// **'Terjadi kesalahan. Periksa koneksi lalu coba lagi.'**
  String get errGeneric;

  /// No description provided for @retry.
  ///
  /// In id, this message translates to:
  /// **'Coba lagi'**
  String get retry;

  /// No description provided for @hello.
  ///
  /// In id, this message translates to:
  /// **'Halo, {name}!'**
  String hello(String name);

  /// No description provided for @levelLabel.
  ///
  /// In id, this message translates to:
  /// **'Level {level}'**
  String levelLabel(int level);

  /// No description provided for @xpToNext.
  ///
  /// In id, this message translates to:
  /// **'{current}/{needed} XP ke level berikutnya'**
  String xpToNext(int current, int needed);

  /// No description provided for @xpWeek.
  ///
  /// In id, this message translates to:
  /// **'XP minggu ini'**
  String get xpWeek;

  /// No description provided for @lessonsDone.
  ///
  /// In id, this message translates to:
  /// **'Pelajaran selesai'**
  String get lessonsDone;

  /// No description provided for @bestStreak.
  ///
  /// In id, this message translates to:
  /// **'Streak terbaik'**
  String get bestStreak;

  /// No description provided for @days.
  ///
  /// In id, this message translates to:
  /// **'{count} hari'**
  String days(int count);

  /// No description provided for @badgesTitle.
  ///
  /// In id, this message translates to:
  /// **'Lencana'**
  String get badgesTitle;

  /// No description provided for @coursesTitle.
  ///
  /// In id, this message translates to:
  /// **'Kelas'**
  String get coursesTitle;

  /// No description provided for @allLevels.
  ///
  /// In id, this message translates to:
  /// **'Semua'**
  String get allLevels;

  /// No description provided for @noCourses.
  ///
  /// In id, this message translates to:
  /// **'Belum ada kelas.'**
  String get noCourses;

  /// No description provided for @teacher.
  ///
  /// In id, this message translates to:
  /// **'Pengajar: {name}'**
  String teacher(String name);

  /// No description provided for @lessonCount.
  ///
  /// In id, this message translates to:
  /// **'{count} pelajaran'**
  String lessonCount(int count);

  /// No description provided for @minutes.
  ///
  /// In id, this message translates to:
  /// **'{count} menit'**
  String minutes(int count);

  /// No description provided for @freePreview.
  ///
  /// In id, this message translates to:
  /// **'Gratis'**
  String get freePreview;

  /// No description provided for @comingSoon.
  ///
  /// In id, this message translates to:
  /// **'Segera hadir'**
  String get comingSoon;

  /// No description provided for @comingSoonBody.
  ///
  /// In id, this message translates to:
  /// **'Fitur ini sedang dibuat. Sementara itu, gunakan versi website.'**
  String get comingSoonBody;

  /// No description provided for @language.
  ///
  /// In id, this message translates to:
  /// **'Bahasa'**
  String get language;

  /// No description provided for @notConfiguredTitle.
  ///
  /// In id, this message translates to:
  /// **'Aplikasi belum dikonfigurasi'**
  String get notConfiguredTitle;

  /// No description provided for @notConfiguredBody.
  ///
  /// In id, this message translates to:
  /// **'Jalankan dengan --dart-define-from-file=env.json (salin dari env.example.json, isi URL dan kunci Supabase).'**
  String get notConfiguredBody;

  /// No description provided for @badgeFirstLesson.
  ///
  /// In id, this message translates to:
  /// **'Langkah pertama'**
  String get badgeFirstLesson;

  /// No description provided for @badgeFirstLessonHow.
  ///
  /// In id, this message translates to:
  /// **'Selesaikan 1 pelajaran'**
  String get badgeFirstLessonHow;

  /// No description provided for @badgeTenLessons.
  ///
  /// In id, this message translates to:
  /// **'Rajin belajar'**
  String get badgeTenLessons;

  /// No description provided for @badgeTenLessonsHow.
  ///
  /// In id, this message translates to:
  /// **'Selesaikan 10 pelajaran'**
  String get badgeTenLessonsHow;

  /// No description provided for @badgeFiftyLessons.
  ///
  /// In id, this message translates to:
  /// **'Pembelajar sejati'**
  String get badgeFiftyLessons;

  /// No description provided for @badgeFiftyLessonsHow.
  ///
  /// In id, this message translates to:
  /// **'Selesaikan 50 pelajaran'**
  String get badgeFiftyLessonsHow;

  /// No description provided for @badgePerfectQuiz.
  ///
  /// In id, this message translates to:
  /// **'Nilai sempurna'**
  String get badgePerfectQuiz;

  /// No description provided for @badgePerfectQuizHow.
  ///
  /// In id, this message translates to:
  /// **'Dapat skor 100% di satu kuis'**
  String get badgePerfectQuizHow;

  /// No description provided for @badgeStreak7.
  ///
  /// In id, this message translates to:
  /// **'Seminggu penuh'**
  String get badgeStreak7;

  /// No description provided for @badgeStreak7How.
  ///
  /// In id, this message translates to:
  /// **'Belajar 7 hari berturut-turut'**
  String get badgeStreak7How;

  /// No description provided for @badgeStreak30.
  ///
  /// In id, this message translates to:
  /// **'Sebulan penuh'**
  String get badgeStreak30;

  /// No description provided for @badgeStreak30How.
  ///
  /// In id, this message translates to:
  /// **'Belajar 30 hari berturut-turut'**
  String get badgeStreak30How;

  /// No description provided for @badgeFirstCertificate.
  ///
  /// In id, this message translates to:
  /// **'Lulus kelas'**
  String get badgeFirstCertificate;

  /// No description provided for @badgeFirstCertificateHow.
  ///
  /// In id, this message translates to:
  /// **'Dapatkan sertifikat pertama'**
  String get badgeFirstCertificateHow;

  /// No description provided for @badgeThreeCertificates.
  ///
  /// In id, this message translates to:
  /// **'Kolektor sertifikat'**
  String get badgeThreeCertificates;

  /// No description provided for @badgeThreeCertificatesHow.
  ///
  /// In id, this message translates to:
  /// **'Dapatkan 3 sertifikat'**
  String get badgeThreeCertificatesHow;

  /// No description provided for @badgeTryoutTaker.
  ///
  /// In id, this message translates to:
  /// **'Pejuang try-out'**
  String get badgeTryoutTaker;

  /// No description provided for @badgeTryoutTakerHow.
  ///
  /// In id, this message translates to:
  /// **'Serahkan 1 try-out'**
  String get badgeTryoutTakerHow;

  /// No description provided for @badgePractice50.
  ///
  /// In id, this message translates to:
  /// **'Tak kenal menyerah'**
  String get badgePractice50;

  /// No description provided for @badgePractice50How.
  ///
  /// In id, this message translates to:
  /// **'Jawab benar 50 soal latihan'**
  String get badgePractice50How;

  /// No description provided for @allTime.
  ///
  /// In id, this message translates to:
  /// **'Sepanjang waktu'**
  String get allTime;

  /// No description provided for @markDone.
  ///
  /// In id, this message translates to:
  /// **'Tandai selesai'**
  String get markDone;

  /// No description provided for @markUndone.
  ///
  /// In id, this message translates to:
  /// **'Tandai belum selesai'**
  String get markUndone;

  /// No description provided for @nextLesson.
  ///
  /// In id, this message translates to:
  /// **'Pelajaran berikutnya'**
  String get nextLesson;

  /// No description provided for @previousLesson.
  ///
  /// In id, this message translates to:
  /// **'Sebelumnya'**
  String get previousLesson;

  /// No description provided for @finishedCourse.
  ///
  /// In id, this message translates to:
  /// **'Kelas selesai'**
  String get finishedCourse;

  /// No description provided for @completed.
  ///
  /// In id, this message translates to:
  /// **'Selesai'**
  String get completed;

  /// No description provided for @lessonNotes.
  ///
  /// In id, this message translates to:
  /// **'Catatan pelajaran'**
  String get lessonNotes;

  /// No description provided for @lessonMaterials.
  ///
  /// In id, this message translates to:
  /// **'Materi pendukung'**
  String get lessonMaterials;

  /// No description provided for @downloadFailed.
  ///
  /// In id, this message translates to:
  /// **'File tidak bisa dibuka. Coba lagi.'**
  String get downloadFailed;

  /// No description provided for @videoUnavailable.
  ///
  /// In id, this message translates to:
  /// **'Video untuk pelajaran ini belum tersedia.'**
  String get videoUnavailable;

  /// No description provided for @saveFailed.
  ///
  /// In id, this message translates to:
  /// **'Gagal menyimpan. Periksa koneksi lalu coba lagi.'**
  String get saveFailed;

  /// No description provided for @lockedTitle.
  ///
  /// In id, this message translates to:
  /// **'Pelajaran ini khusus pelanggan'**
  String get lockedTitle;

  /// No description provided for @lockedText.
  ///
  /// In id, this message translates to:
  /// **'Video, catatan, dan materi pelajaran ini terbuka untuk pelanggan paket jenjangnya. Pelajaran bertanda Gratis bisa ditonton tanpa berlangganan.'**
  String get lockedText;

  /// No description provided for @openOnWebsite.
  ///
  /// In id, this message translates to:
  /// **'Lihat di website'**
  String get openOnWebsite;

  /// No description provided for @completedOf.
  ///
  /// In id, this message translates to:
  /// **'{done} dari {total} pelajaran selesai'**
  String completedOf(int done, int total);

  /// No description provided for @startCourse.
  ///
  /// In id, this message translates to:
  /// **'Mulai belajar'**
  String get startCourse;

  /// No description provided for @resumeCourse.
  ///
  /// In id, this message translates to:
  /// **'Lanjutkan belajar'**
  String get resumeCourse;

  /// No description provided for @reviewCourse.
  ///
  /// In id, this message translates to:
  /// **'Ulangi kelas'**
  String get reviewCourse;

  /// No description provided for @lessonList.
  ///
  /// In id, this message translates to:
  /// **'Daftar pelajaran'**
  String get lessonList;

  /// No description provided for @next.
  ///
  /// In id, this message translates to:
  /// **'Berikutnya'**
  String get next;

  /// No description provided for @quizTitle.
  ///
  /// In id, this message translates to:
  /// **'Kuis'**
  String get quizTitle;

  /// No description provided for @takeQuiz.
  ///
  /// In id, this message translates to:
  /// **'Kerjakan kuis'**
  String get takeQuiz;

  /// No description provided for @retakeQuiz.
  ///
  /// In id, this message translates to:
  /// **'Ulangi kuis'**
  String get retakeQuiz;

  /// No description provided for @quizBest.
  ///
  /// In id, this message translates to:
  /// **'Skor terbaik: {score}/{total}'**
  String quizBest(int score, int total);

  /// No description provided for @quizCount.
  ///
  /// In id, this message translates to:
  /// **'{count} soal latihan'**
  String quizCount(int count);

  /// No description provided for @questionNumber.
  ///
  /// In id, this message translates to:
  /// **'Soal {number}'**
  String questionNumber(int number);

  /// No description provided for @quizProgress.
  ///
  /// In id, this message translates to:
  /// **'{answered} dari {total} soal terjawab'**
  String quizProgress(int answered, int total);

  /// No description provided for @checkAnswers.
  ///
  /// In id, this message translates to:
  /// **'Periksa jawaban'**
  String get checkAnswers;

  /// No description provided for @correct.
  ///
  /// In id, this message translates to:
  /// **'Benar'**
  String get correct;

  /// No description provided for @wrong.
  ///
  /// In id, this message translates to:
  /// **'Salah'**
  String get wrong;

  /// No description provided for @explanation.
  ///
  /// In id, this message translates to:
  /// **'Pembahasan'**
  String get explanation;

  /// No description provided for @yourScore.
  ///
  /// In id, this message translates to:
  /// **'Skor kamu'**
  String get yourScore;

  /// No description provided for @scoreLine.
  ///
  /// In id, this message translates to:
  /// **'{score} dari {total} benar'**
  String scoreLine(int score, int total);

  /// No description provided for @verdictGreat.
  ///
  /// In id, this message translates to:
  /// **'Sempurna! Kamu menguasai materi ini.'**
  String get verdictGreat;

  /// No description provided for @verdictGood.
  ///
  /// In id, this message translates to:
  /// **'Bagus! Tinggal sedikit lagi.'**
  String get verdictGood;

  /// No description provided for @verdictReview.
  ///
  /// In id, this message translates to:
  /// **'Yuk tinjau lagi materinya, lalu coba lagi.'**
  String get verdictReview;

  /// No description provided for @backToCourse.
  ///
  /// In id, this message translates to:
  /// **'Kembali ke kelas'**
  String get backToCourse;

  /// No description provided for @submitFailed.
  ///
  /// In id, this message translates to:
  /// **'Jawaban gagal dikirim. Periksa koneksi lalu coba lagi.'**
  String get submitFailed;

  /// No description provided for @quizNoAccess.
  ///
  /// In id, this message translates to:
  /// **'Kuis ini khusus pelanggan paket jenjangnya.'**
  String get quizNoAccess;

  /// No description provided for @certificateTitle.
  ///
  /// In id, this message translates to:
  /// **'Sertifikat'**
  String get certificateTitle;

  /// No description provided for @viewCertificate.
  ///
  /// In id, this message translates to:
  /// **'Lihat sertifikat'**
  String get viewCertificate;

  /// No description provided for @claimCertificate.
  ///
  /// In id, this message translates to:
  /// **'Ambil sertifikat'**
  String get claimCertificate;

  /// No description provided for @reqLessons.
  ///
  /// In id, this message translates to:
  /// **'Selesaikan semua pelajaran ({done}/{total})'**
  String reqLessons(int done, int total);

  /// No description provided for @reqQuiz.
  ///
  /// In id, this message translates to:
  /// **'Raih skor kuis minimal {percent}%'**
  String reqQuiz(int percent);

  /// No description provided for @certNotComplete.
  ///
  /// In id, this message translates to:
  /// **'Selesaikan semua pelajaran terlebih dahulu.'**
  String get certNotComplete;

  /// No description provided for @certQuizRequired.
  ///
  /// In id, this message translates to:
  /// **'Skor kuis terbaikmu belum mencapai {percent}%.'**
  String certQuizRequired(int percent);

  /// No description provided for @certNoAccess.
  ///
  /// In id, this message translates to:
  /// **'Kamu belum punya akses ke kelas ini.'**
  String get certNoAccess;

  /// No description provided for @certGeneric.
  ///
  /// In id, this message translates to:
  /// **'Sertifikat gagal dibuat. Coba lagi.'**
  String get certGeneric;

  /// No description provided for @certHeading.
  ///
  /// In id, this message translates to:
  /// **'Sertifikat Penyelesaian'**
  String get certHeading;

  /// No description provided for @presentedTo.
  ///
  /// In id, this message translates to:
  /// **'Diberikan kepada'**
  String get presentedTo;

  /// No description provided for @forCompleting.
  ///
  /// In id, this message translates to:
  /// **'atas keberhasilan menyelesaikan kelas'**
  String get forCompleting;

  /// No description provided for @certQuizScore.
  ///
  /// In id, this message translates to:
  /// **'Skor kuis: {score}/{total} ({percent}%)'**
  String certQuizScore(int score, int total, int percent);

  /// No description provided for @issuedOn.
  ///
  /// In id, this message translates to:
  /// **'Tanggal terbit'**
  String get issuedOn;

  /// No description provided for @certCode.
  ///
  /// In id, this message translates to:
  /// **'Kode sertifikat'**
  String get certCode;

  /// No description provided for @printOnWebsite.
  ///
  /// In id, this message translates to:
  /// **'Cetak / simpan PDF di website'**
  String get printOnWebsite;

  /// No description provided for @copyVerifyLink.
  ///
  /// In id, this message translates to:
  /// **'Salin tautan verifikasi'**
  String get copyVerifyLink;

  /// No description provided for @linkCopied.
  ///
  /// In id, this message translates to:
  /// **'Tautan disalin'**
  String get linkCopied;

  /// No description provided for @myCertificates.
  ///
  /// In id, this message translates to:
  /// **'Sertifikat saya'**
  String get myCertificates;

  /// No description provided for @noCertificates.
  ///
  /// In id, this message translates to:
  /// **'Belum ada sertifikat. Selesaikan kelas untuk mendapatkannya.'**
  String get noCertificates;

  /// No description provided for @editName.
  ///
  /// In id, this message translates to:
  /// **'Ubah nama'**
  String get editName;

  /// No description provided for @save.
  ///
  /// In id, this message translates to:
  /// **'Simpan'**
  String get save;

  /// No description provided for @cancel.
  ///
  /// In id, this message translates to:
  /// **'Batal'**
  String get cancel;

  /// No description provided for @changePhoto.
  ///
  /// In id, this message translates to:
  /// **'Ganti foto'**
  String get changePhoto;

  /// No description provided for @choosePhoto.
  ///
  /// In id, this message translates to:
  /// **'Pilih dari galeri'**
  String get choosePhoto;

  /// No description provided for @removePhoto.
  ///
  /// In id, this message translates to:
  /// **'Hapus foto'**
  String get removePhoto;

  /// No description provided for @weeklyGoal.
  ///
  /// In id, this message translates to:
  /// **'Target mingguan'**
  String get weeklyGoal;

  /// No description provided for @weeklyGoalValue.
  ///
  /// In id, this message translates to:
  /// **'{count} pelajaran per minggu'**
  String weeklyGoalValue(int count);

  /// No description provided for @showOnLeaderboard.
  ///
  /// In id, this message translates to:
  /// **'Tampilkan nama di peringkat'**
  String get showOnLeaderboard;

  /// No description provided for @showOnLeaderboardHint.
  ///
  /// In id, this message translates to:
  /// **'Jika dimatikan, namamu tidak terlihat oleh siswa lain.'**
  String get showOnLeaderboardHint;

  /// No description provided for @errNameRequired.
  ///
  /// In id, this message translates to:
  /// **'Nama wajib diisi.'**
  String get errNameRequired;

  /// No description provided for @errNameTooLong.
  ///
  /// In id, this message translates to:
  /// **'Nama maksimal 80 karakter.'**
  String get errNameTooLong;

  /// No description provided for @errFileType.
  ///
  /// In id, this message translates to:
  /// **'Gunakan foto PNG, JPG, atau WEBP.'**
  String get errFileType;

  /// No description provided for @errFileSize.
  ///
  /// In id, this message translates to:
  /// **'Ukuran foto maksimal 2 MB.'**
  String get errFileSize;

  /// No description provided for @saved.
  ///
  /// In id, this message translates to:
  /// **'Tersimpan'**
  String get saved;

  /// No description provided for @practiceTitle.
  ///
  /// In id, this message translates to:
  /// **'Latihan pintar'**
  String get practiceTitle;

  /// No description provided for @practiceSubtitle.
  ///
  /// In id, this message translates to:
  /// **'Soal kuis yang pernah salah muncul lagi di waktu yang tepat sampai kamu menguasainya.'**
  String get practiceSubtitle;

  /// No description provided for @practiceDue.
  ///
  /// In id, this message translates to:
  /// **'{count} soal siap diulang'**
  String practiceDue(int count);

  /// No description provided for @practiceIntro.
  ///
  /// In id, this message translates to:
  /// **'Satu sesi berisi sampai 10 soal. Benar → muncul lagi beberapa hari kemudian; salah → besok.'**
  String get practiceIntro;

  /// No description provided for @practiceNothingDue.
  ///
  /// In id, this message translates to:
  /// **'Tidak ada soal untuk diulang sekarang'**
  String get practiceNothingDue;

  /// No description provided for @practiceNothingTracked.
  ///
  /// In id, this message translates to:
  /// **'Kerjakan kuis di kelas mana pun. Soal yang salah otomatis masuk ke sini.'**
  String get practiceNothingTracked;

  /// No description provided for @practiceNextDue.
  ///
  /// In id, this message translates to:
  /// **'Soal berikutnya muncul {date}.'**
  String practiceNextDue(String date);

  /// No description provided for @practiceBrowse.
  ///
  /// In id, this message translates to:
  /// **'Jelajahi kelas'**
  String get practiceBrowse;

  /// No description provided for @practiceStart.
  ///
  /// In id, this message translates to:
  /// **'Mulai latihan'**
  String get practiceStart;

  /// No description provided for @practiceAgain.
  ///
  /// In id, this message translates to:
  /// **'Latihan lagi'**
  String get practiceAgain;

  /// No description provided for @practiceProgress.
  ///
  /// In id, this message translates to:
  /// **'Soal {current} dari {total}'**
  String practiceProgress(int current, int total);

  /// No description provided for @practiceCheck.
  ///
  /// In id, this message translates to:
  /// **'Periksa'**
  String get practiceCheck;

  /// No description provided for @practiceCorrect.
  ///
  /// In id, this message translates to:
  /// **'Benar!'**
  String get practiceCorrect;

  /// No description provided for @practiceWrong.
  ///
  /// In id, this message translates to:
  /// **'Belum tepat.'**
  String get practiceWrong;

  /// No description provided for @practiceMastered.
  ///
  /// In id, this message translates to:
  /// **'Dikuasai! Soal ini keluar dari antrean.'**
  String get practiceMastered;

  /// No description provided for @practiceDone.
  ///
  /// In id, this message translates to:
  /// **'Sesi selesai'**
  String get practiceDone;

  /// No description provided for @practiceScore.
  ///
  /// In id, this message translates to:
  /// **'{correct} dari {total} benar.'**
  String practiceScore(int correct, int total);

  /// No description provided for @practiceMasteredCount.
  ///
  /// In id, this message translates to:
  /// **'{count} soal dikuasai.'**
  String practiceMasteredCount(int count);

  /// No description provided for @tryoutTitle.
  ///
  /// In id, this message translates to:
  /// **'Try-out UTBK'**
  String get tryoutTitle;

  /// No description provided for @tryoutSubtitle.
  ///
  /// In id, this message translates to:
  /// **'Latihan ujian bertimer per subtes, lengkap dengan skor, peringkat, dan pembahasan.'**
  String get tryoutSubtitle;

  /// No description provided for @tryoutEmpty.
  ///
  /// In id, this message translates to:
  /// **'Belum ada try-out yang dibuka.'**
  String get tryoutEmpty;

  /// No description provided for @tryoutSectionCount.
  ///
  /// In id, this message translates to:
  /// **'{count} subtes'**
  String tryoutSectionCount(int count);

  /// No description provided for @tryoutTotalTime.
  ///
  /// In id, this message translates to:
  /// **'Total waktu {count} menit'**
  String tryoutTotalTime(int count);

  /// No description provided for @tryoutOpensAt.
  ///
  /// In id, this message translates to:
  /// **'Dibuka {date}'**
  String tryoutOpensAt(String date);

  /// No description provided for @tryoutClosesAt.
  ///
  /// In id, this message translates to:
  /// **'Ditutup {date}'**
  String tryoutClosesAt(String date);

  /// No description provided for @tryoutWindowOpen.
  ///
  /// In id, this message translates to:
  /// **'Dibuka'**
  String get tryoutWindowOpen;

  /// No description provided for @tryoutWindowUpcoming.
  ///
  /// In id, this message translates to:
  /// **'Segera dibuka'**
  String get tryoutWindowUpcoming;

  /// No description provided for @tryoutWindowClosed.
  ///
  /// In id, this message translates to:
  /// **'Sudah ditutup'**
  String get tryoutWindowClosed;

  /// No description provided for @tryoutSections.
  ///
  /// In id, this message translates to:
  /// **'Subtes'**
  String get tryoutSections;

  /// No description provided for @tryoutRule1.
  ///
  /// In id, this message translates to:
  /// **'Subtes dikerjakan berurutan dengan waktu masing-masing; subtes yang sudah lewat tidak bisa dibuka lagi.'**
  String get tryoutRule1;

  /// No description provided for @tryoutRule2.
  ///
  /// In id, this message translates to:
  /// **'Jawaban tersimpan otomatis. Jika koneksi terputus, buka lagi try-out ini untuk melanjutkan.'**
  String get tryoutRule2;

  /// No description provided for @tryoutRule3.
  ///
  /// In id, this message translates to:
  /// **'Waktu habis = jawaban otomatis diserahkan. Hanya satu kali percobaan yang dihitung untuk peringkat.'**
  String get tryoutRule3;

  /// No description provided for @tryoutStart.
  ///
  /// In id, this message translates to:
  /// **'Mulai try-out'**
  String get tryoutStart;

  /// No description provided for @tryoutContinue.
  ///
  /// In id, this message translates to:
  /// **'Lanjutkan try-out'**
  String get tryoutContinue;

  /// No description provided for @tryoutDone.
  ///
  /// In id, this message translates to:
  /// **'Selesai'**
  String get tryoutDone;

  /// No description provided for @tryoutOneAttempt.
  ///
  /// In id, this message translates to:
  /// **'Kamu hanya punya satu kesempatan. Pastikan koneksi stabil sebelum mulai.'**
  String get tryoutOneAttempt;

  /// No description provided for @tryoutSectionOf.
  ///
  /// In id, this message translates to:
  /// **'Subtes {current} dari {total}'**
  String tryoutSectionOf(int current, int total);

  /// No description provided for @tryoutAnsweredOf.
  ///
  /// In id, this message translates to:
  /// **'{answered} dari {total} terjawab'**
  String tryoutAnsweredOf(int answered, int total);

  /// No description provided for @tryoutSaving.
  ///
  /// In id, this message translates to:
  /// **'Menyimpan…'**
  String get tryoutSaving;

  /// No description provided for @tryoutSaved.
  ///
  /// In id, this message translates to:
  /// **'Tersimpan'**
  String get tryoutSaved;

  /// No description provided for @tryoutSaveFailed.
  ///
  /// In id, this message translates to:
  /// **'Gagal menyimpan, akan dicoba lagi'**
  String get tryoutSaveFailed;

  /// No description provided for @tryoutNextSection.
  ///
  /// In id, this message translates to:
  /// **'Lanjut subtes berikutnya'**
  String get tryoutNextSection;

  /// No description provided for @tryoutSubmit.
  ///
  /// In id, this message translates to:
  /// **'Serahkan jawaban'**
  String get tryoutSubmit;

  /// No description provided for @tryoutConfirmNext.
  ///
  /// In id, this message translates to:
  /// **'Lanjut ke subtes berikutnya? Kamu tidak bisa kembali ke subtes ini. Soal kosong: {count}.'**
  String tryoutConfirmNext(int count);

  /// No description provided for @tryoutConfirmSubmit.
  ///
  /// In id, this message translates to:
  /// **'Serahkan semua jawaban sekarang? Jawaban tidak bisa diubah lagi. Soal kosong: {count}.'**
  String tryoutConfirmSubmit(int count);

  /// No description provided for @tryoutSubmitting.
  ///
  /// In id, this message translates to:
  /// **'Menyerahkan jawaban…'**
  String get tryoutSubmitting;

  /// No description provided for @tryoutErrNoAccess.
  ///
  /// In id, this message translates to:
  /// **'Try-out ini termasuk paket berbayar. Berlangganan untuk mengerjakannya.'**
  String get tryoutErrNoAccess;

  /// No description provided for @tryoutErrClosed.
  ///
  /// In id, this message translates to:
  /// **'Try-out ini sedang tidak dibuka.'**
  String get tryoutErrClosed;

  /// No description provided for @tryoutErrNotSignedIn.
  ///
  /// In id, this message translates to:
  /// **'Masuk dulu untuk mengerjakan try-out.'**
  String get tryoutErrNotSignedIn;

  /// No description provided for @tryoutErrGeneric.
  ///
  /// In id, this message translates to:
  /// **'Try-out gagal dimuat. Coba lagi.'**
  String get tryoutErrGeneric;

  /// No description provided for @tryoutYourResult.
  ///
  /// In id, this message translates to:
  /// **'Hasil kamu'**
  String get tryoutYourResult;

  /// No description provided for @tryoutRank.
  ///
  /// In id, this message translates to:
  /// **'Peringkat {rank} dari {participants}'**
  String tryoutRank(int rank, int participants);

  /// No description provided for @tryoutFocus.
  ///
  /// In id, this message translates to:
  /// **'Perlu dipelajari lagi'**
  String get tryoutFocus;

  /// No description provided for @tryoutAllGood.
  ///
  /// In id, this message translates to:
  /// **'Semua subtes sudah bagus. Pertahankan!'**
  String get tryoutAllGood;

  /// No description provided for @tryoutPerSection.
  ///
  /// In id, this message translates to:
  /// **'Skor per subtes'**
  String get tryoutPerSection;

  /// No description provided for @tryoutAverage.
  ///
  /// In id, this message translates to:
  /// **'rata-rata peserta {percent}%'**
  String tryoutAverage(int percent);

  /// No description provided for @tryoutReview.
  ///
  /// In id, this message translates to:
  /// **'Pembahasan'**
  String get tryoutReview;

  /// No description provided for @tryoutUnanswered.
  ///
  /// In id, this message translates to:
  /// **'Tidak dijawab'**
  String get tryoutUnanswered;

  /// No description provided for @tryoutLeaderboard.
  ///
  /// In id, this message translates to:
  /// **'Peringkat peserta'**
  String get tryoutLeaderboard;

  /// No description provided for @tryoutLeaderboardEmpty.
  ///
  /// In id, this message translates to:
  /// **'Belum ada peserta yang menyerahkan jawaban.'**
  String get tryoutLeaderboardEmpty;

  /// No description provided for @tryoutHiddenName.
  ///
  /// In id, this message translates to:
  /// **'Peserta'**
  String get tryoutHiddenName;

  /// No description provided for @tryoutYou.
  ///
  /// In id, this message translates to:
  /// **'kamu'**
  String get tryoutYou;

  /// No description provided for @tryoutSubmittedOn.
  ///
  /// In id, this message translates to:
  /// **'Diserahkan {date}'**
  String tryoutSubmittedOn(String date);

  /// No description provided for @continueAction.
  ///
  /// In id, this message translates to:
  /// **'Lanjut'**
  String get continueAction;

  /// No description provided for @quickLinks.
  ///
  /// In id, this message translates to:
  /// **'Fitur lainnya'**
  String get quickLinks;

  /// No description provided for @liveTitle.
  ///
  /// In id, this message translates to:
  /// **'Kelas live'**
  String get liveTitle;

  /// No description provided for @classesTitle.
  ///
  /// In id, this message translates to:
  /// **'Kelas sekolah'**
  String get classesTitle;

  /// No description provided for @discussionTitle.
  ///
  /// In id, this message translates to:
  /// **'Diskusi'**
  String get discussionTitle;

  /// No description provided for @discussionAsk.
  ///
  /// In id, this message translates to:
  /// **'Tulis pertanyaanmu tentang pelajaran ini…'**
  String get discussionAsk;

  /// No description provided for @discussionReplyHint.
  ///
  /// In id, this message translates to:
  /// **'Tulis jawaban…'**
  String get discussionReplyHint;

  /// No description provided for @discussionReply.
  ///
  /// In id, this message translates to:
  /// **'Balas'**
  String get discussionReply;

  /// No description provided for @discussionEmpty.
  ///
  /// In id, this message translates to:
  /// **'Belum ada pertanyaan. Jadilah yang pertama bertanya.'**
  String get discussionEmpty;

  /// No description provided for @discussionFailed.
  ///
  /// In id, this message translates to:
  /// **'Gagal mengirim. Coba lagi.'**
  String get discussionFailed;

  /// No description provided for @discussionDelete.
  ///
  /// In id, this message translates to:
  /// **'Hapus'**
  String get discussionDelete;

  /// No description provided for @discussionConfirmDelete.
  ///
  /// In id, this message translates to:
  /// **'Hapus tulisan ini?'**
  String get discussionConfirmDelete;

  /// No description provided for @discussionTeacher.
  ///
  /// In id, this message translates to:
  /// **'Pengajar'**
  String get discussionTeacher;

  /// No description provided for @discussionReplyingTo.
  ///
  /// In id, this message translates to:
  /// **'Membalas {name}'**
  String discussionReplyingTo(String name);

  /// No description provided for @discussionOpen.
  ///
  /// In id, this message translates to:
  /// **'Diskusi pelajaran'**
  String get discussionOpen;

  /// No description provided for @send.
  ///
  /// In id, this message translates to:
  /// **'Kirim'**
  String get send;

  /// No description provided for @liveSubtitle.
  ///
  /// In id, this message translates to:
  /// **'Belajar langsung bersama pengajar. Rekamannya bisa ditonton lagi.'**
  String get liveSubtitle;

  /// No description provided for @liveUpcoming.
  ///
  /// In id, this message translates to:
  /// **'Jadwal mendatang'**
  String get liveUpcoming;

  /// No description provided for @liveNoUpcoming.
  ///
  /// In id, this message translates to:
  /// **'Belum ada jadwal kelas live.'**
  String get liveNoUpcoming;

  /// No description provided for @livePast.
  ///
  /// In id, this message translates to:
  /// **'Rekaman sebelumnya'**
  String get livePast;

  /// No description provided for @liveHost.
  ///
  /// In id, this message translates to:
  /// **'Bersama {name}'**
  String liveHost(String name);

  /// No description provided for @livePhaseUpcoming.
  ///
  /// In id, this message translates to:
  /// **'Akan datang'**
  String get livePhaseUpcoming;

  /// No description provided for @livePhaseSoon.
  ///
  /// In id, this message translates to:
  /// **'Segera dimulai'**
  String get livePhaseSoon;

  /// No description provided for @livePhaseLive.
  ///
  /// In id, this message translates to:
  /// **'Sedang berlangsung'**
  String get livePhaseLive;

  /// No description provided for @livePhaseEnded.
  ///
  /// In id, this message translates to:
  /// **'Selesai'**
  String get livePhaseEnded;

  /// No description provided for @liveAddToCalendar.
  ///
  /// In id, this message translates to:
  /// **'Tambah ke kalender'**
  String get liveAddToCalendar;

  /// No description provided for @liveJoin.
  ///
  /// In id, this message translates to:
  /// **'Masuk kelas live'**
  String get liveJoin;

  /// No description provided for @liveLinkLater.
  ///
  /// In id, this message translates to:
  /// **'Tombol masuk muncul 15 menit sebelum kelas dimulai.'**
  String get liveLinkLater;

  /// No description provided for @liveLocked.
  ///
  /// In id, this message translates to:
  /// **'Kelas live ini khusus pelanggan paket jenjangnya.'**
  String get liveLocked;

  /// No description provided for @liveRecording.
  ///
  /// In id, this message translates to:
  /// **'Rekaman'**
  String get liveRecording;

  /// No description provided for @liveNoRecording.
  ///
  /// In id, this message translates to:
  /// **'Rekaman belum tersedia.'**
  String get liveNoRecording;

  /// No description provided for @classesSubtitle.
  ///
  /// In id, this message translates to:
  /// **'Gabung kelas dari gurumu dan kerjakan tugasnya di sini.'**
  String get classesSubtitle;

  /// No description provided for @classesCode.
  ///
  /// In id, this message translates to:
  /// **'Kode kelas dari guru'**
  String get classesCode;

  /// No description provided for @classesJoin.
  ///
  /// In id, this message translates to:
  /// **'Gabung'**
  String get classesJoin;

  /// No description provided for @classesJoined.
  ///
  /// In id, this message translates to:
  /// **'Berhasil bergabung ke {name}.'**
  String classesJoined(String name);

  /// No description provided for @classesErrInvalid.
  ///
  /// In id, this message translates to:
  /// **'Kode kelas tidak ditemukan.'**
  String get classesErrInvalid;

  /// No description provided for @classesErrOwn.
  ///
  /// In id, this message translates to:
  /// **'Kamu guru di kelas ini.'**
  String get classesErrOwn;

  /// No description provided for @classesErrGeneric.
  ///
  /// In id, this message translates to:
  /// **'Gagal bergabung. Coba lagi.'**
  String get classesErrGeneric;

  /// No description provided for @classesTodo.
  ///
  /// In id, this message translates to:
  /// **'Tugas'**
  String get classesTodo;

  /// No description provided for @classesDone.
  ///
  /// In id, this message translates to:
  /// **'Selesai'**
  String get classesDone;

  /// No description provided for @classesNoTasks.
  ///
  /// In id, this message translates to:
  /// **'Belum ada tugas.'**
  String get classesNoTasks;

  /// No description provided for @classesAllDone.
  ///
  /// In id, this message translates to:
  /// **'Semua tugas sudah selesai. Mantap!'**
  String get classesAllDone;

  /// No description provided for @classesKindLesson.
  ///
  /// In id, this message translates to:
  /// **'Tonton pelajaran'**
  String get classesKindLesson;

  /// No description provided for @classesKindQuiz.
  ///
  /// In id, this message translates to:
  /// **'Kerjakan kuis'**
  String get classesKindQuiz;

  /// No description provided for @classesKindCourse.
  ///
  /// In id, this message translates to:
  /// **'Selesaikan kelas'**
  String get classesKindCourse;

  /// No description provided for @classesDue.
  ///
  /// In id, this message translates to:
  /// **'Tenggat {date}'**
  String classesDue(String date);

  /// No description provided for @classesOverdue.
  ///
  /// In id, this message translates to:
  /// **'Lewat tenggat {date}'**
  String classesOverdue(String date);

  /// No description provided for @classesNoDue.
  ///
  /// In id, this message translates to:
  /// **'Tanpa tenggat'**
  String get classesNoDue;

  /// No description provided for @classesScore.
  ///
  /// In id, this message translates to:
  /// **'nilai {percent}%'**
  String classesScore(int percent);

  /// No description provided for @classesStart.
  ///
  /// In id, this message translates to:
  /// **'Kerjakan'**
  String get classesStart;

  /// No description provided for @classesOpen.
  ///
  /// In id, this message translates to:
  /// **'Buka'**
  String get classesOpen;

  /// No description provided for @classesMine.
  ///
  /// In id, this message translates to:
  /// **'Kelas yang diikuti'**
  String get classesMine;

  /// No description provided for @classesLeave.
  ///
  /// In id, this message translates to:
  /// **'Keluar'**
  String get classesLeave;

  /// No description provided for @classesConfirmLeave.
  ///
  /// In id, this message translates to:
  /// **'Keluar dari kelas {name}?'**
  String classesConfirmLeave(String name);

  /// No description provided for @tutorTitle.
  ///
  /// In id, this message translates to:
  /// **'Tanya AI'**
  String get tutorTitle;

  /// No description provided for @tutorSubtitle.
  ///
  /// In id, this message translates to:
  /// **'Tutor AI menjawab pertanyaanmu tentang pelajaran ini.'**
  String get tutorSubtitle;

  /// No description provided for @tutorName.
  ///
  /// In id, this message translates to:
  /// **'Tutor Jenius'**
  String get tutorName;

  /// No description provided for @tutorYou.
  ///
  /// In id, this message translates to:
  /// **'Kamu'**
  String get tutorYou;

  /// No description provided for @tutorEmpty.
  ///
  /// In id, this message translates to:
  /// **'Contoh: \"Kenapa hasilnya dibagi dua?\" atau \"Beri satu contoh soal lagi.\"'**
  String get tutorEmpty;

  /// No description provided for @tutorPlaceholder.
  ///
  /// In id, this message translates to:
  /// **'Tulis pertanyaanmu…'**
  String get tutorPlaceholder;

  /// No description provided for @tutorThinking.
  ///
  /// In id, this message translates to:
  /// **'Sedang berpikir…'**
  String get tutorThinking;

  /// No description provided for @tutorDisclaimer.
  ///
  /// In id, this message translates to:
  /// **'Jawaban AI bisa keliru. Cek kembali dengan materi atau tanyakan ke guru di Diskusi.'**
  String get tutorDisclaimer;

  /// No description provided for @tutorExplain.
  ///
  /// In id, this message translates to:
  /// **'Jelaskan dengan AI'**
  String get tutorExplain;

  /// No description provided for @tutorErrInvalid.
  ///
  /// In id, this message translates to:
  /// **'Pertanyaan tidak valid.'**
  String get tutorErrInvalid;

  /// No description provided for @tutorErrNotSignedIn.
  ///
  /// In id, this message translates to:
  /// **'Masuk dulu untuk memakai tutor AI.'**
  String get tutorErrNotSignedIn;

  /// No description provided for @tutorErrNoAccess.
  ///
  /// In id, this message translates to:
  /// **'Kamu belum punya akses ke materi ini.'**
  String get tutorErrNoAccess;

  /// No description provided for @tutorErrQuota.
  ///
  /// In id, this message translates to:
  /// **'Kuota tutor AI hari ini sudah habis. Coba lagi besok.'**
  String get tutorErrQuota;

  /// No description provided for @tutorErrNotConfigured.
  ///
  /// In id, this message translates to:
  /// **'Tutor AI belum diaktifkan.'**
  String get tutorErrNotConfigured;

  /// No description provided for @tutorErrGeneric.
  ///
  /// In id, this message translates to:
  /// **'Tutor AI sedang tidak bisa dihubungi. Coba lagi.'**
  String get tutorErrGeneric;

  /// No description provided for @parentTitle.
  ///
  /// In id, this message translates to:
  /// **'Pantauan orang tua'**
  String get parentTitle;

  /// No description provided for @parentSubtitle.
  ///
  /// In id, this message translates to:
  /// **'Lihat perkembangan belajar anak setiap minggu.'**
  String get parentSubtitle;

  /// No description provided for @parentCode.
  ///
  /// In id, this message translates to:
  /// **'Kode dari anak'**
  String get parentCode;

  /// No description provided for @parentCodeHint.
  ///
  /// In id, this message translates to:
  /// **'Anak membuat kode 8 karakter di halaman Profil miliknya (berlaku 7 hari).'**
  String get parentCodeHint;

  /// No description provided for @parentLink.
  ///
  /// In id, this message translates to:
  /// **'Tautkan'**
  String get parentLink;

  /// No description provided for @parentLinked.
  ///
  /// In id, this message translates to:
  /// **'Berhasil tertaut dengan {name}.'**
  String parentLinked(String name);

  /// No description provided for @parentEmpty.
  ///
  /// In id, this message translates to:
  /// **'Belum ada anak yang tertaut. Masukkan kode dari akun anak di atas.'**
  String get parentEmpty;

  /// No description provided for @parentErrInvalid.
  ///
  /// In id, this message translates to:
  /// **'Kode tidak ditemukan atau sudah kedaluwarsa.'**
  String get parentErrInvalid;

  /// No description provided for @parentErrOwn.
  ///
  /// In id, this message translates to:
  /// **'Itu kode milik akunmu sendiri.'**
  String get parentErrOwn;

  /// No description provided for @parentErrGeneric.
  ///
  /// In id, this message translates to:
  /// **'Gagal menautkan. Coba lagi.'**
  String get parentErrGeneric;

  /// No description provided for @parentLastActive.
  ///
  /// In id, this message translates to:
  /// **'Terakhir belajar {date}'**
  String parentLastActive(String date);

  /// No description provided for @parentNeverActive.
  ///
  /// In id, this message translates to:
  /// **'Belum pernah belajar'**
  String get parentNeverActive;

  /// No description provided for @parentStreak.
  ///
  /// In id, this message translates to:
  /// **'Streak'**
  String get parentStreak;

  /// No description provided for @parentLessonsWeek.
  ///
  /// In id, this message translates to:
  /// **'Pelajaran (7 hari)'**
  String get parentLessonsWeek;

  /// No description provided for @parentQuizzesWeek.
  ///
  /// In id, this message translates to:
  /// **'Kuis (7 hari)'**
  String get parentQuizzesWeek;

  /// No description provided for @parentAvgQuiz.
  ///
  /// In id, this message translates to:
  /// **'Rata-rata kuis'**
  String get parentAvgQuiz;

  /// No description provided for @parentCourses.
  ///
  /// In id, this message translates to:
  /// **'Kelas yang diikuti'**
  String get parentCourses;

  /// No description provided for @parentCopySummary.
  ///
  /// In id, this message translates to:
  /// **'Salin ringkasan'**
  String get parentCopySummary;

  /// No description provided for @parentShareText.
  ///
  /// In id, this message translates to:
  /// **'Ringkasan belajar {name} minggu ini di JeniusAcademy: {lessons} pelajaran selesai, {quizzes} kuis, streak {streak} hari.'**
  String parentShareText(String name, int lessons, int quizzes, int streak);

  /// No description provided for @parentUnlink.
  ///
  /// In id, this message translates to:
  /// **'Lepaskan tautan'**
  String get parentUnlink;

  /// No description provided for @parentConfirmUnlink.
  ///
  /// In id, this message translates to:
  /// **'Berhenti memantau {name}?'**
  String parentConfirmUnlink(String name);

  /// No description provided for @parentConfirmUnlinkParent.
  ///
  /// In id, this message translates to:
  /// **'Lepaskan {name} sebagai orang tua yang memantau akunmu?'**
  String parentConfirmUnlinkParent(String name);

  /// No description provided for @parentProfileTitle.
  ///
  /// In id, this message translates to:
  /// **'Orang tua'**
  String get parentProfileTitle;

  /// No description provided for @parentProfileHint.
  ///
  /// In id, this message translates to:
  /// **'Buat kode, lalu berikan ke orang tua. Mereka memasukkannya di menu Pantauan orang tua untuk melihat ringkasan belajarmu (bukan jawaban atau pesanmu).'**
  String get parentProfileHint;

  /// No description provided for @parentCreateCode.
  ///
  /// In id, this message translates to:
  /// **'Buat kode untuk orang tua'**
  String get parentCreateCode;

  /// No description provided for @parentCodeExpires.
  ///
  /// In id, this message translates to:
  /// **'Berlaku sampai {date}'**
  String parentCodeExpires(String date);

  /// No description provided for @copied.
  ///
  /// In id, this message translates to:
  /// **'Disalin'**
  String get copied;

  /// No description provided for @availableOffline.
  ///
  /// In id, this message translates to:
  /// **'Tersedia offline'**
  String get availableOffline;

  /// No description provided for @removeDownload.
  ///
  /// In id, this message translates to:
  /// **'Hapus unduhan'**
  String get removeDownload;

  /// No description provided for @offlineBanner.
  ///
  /// In id, this message translates to:
  /// **'Kamu sedang offline. Menampilkan data yang tersimpan.'**
  String get offlineBanner;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'id'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'id':
      return AppLocalizationsId();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
