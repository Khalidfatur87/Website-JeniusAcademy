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
