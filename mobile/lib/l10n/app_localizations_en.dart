// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appName => 'JeniusAcademy';

  @override
  String get tabHome => 'Home';

  @override
  String get tabCourses => 'Courses';

  @override
  String get tabPractice => 'Practice';

  @override
  String get tabLeaderboard => 'Leaderboard';

  @override
  String get tabProfile => 'Profile';

  @override
  String get email => 'Email';

  @override
  String get password => 'Password';

  @override
  String get name => 'Full name';

  @override
  String get login => 'Sign in';

  @override
  String get register => 'Sign up';

  @override
  String get logout => 'Sign out';

  @override
  String get loginTitle => 'Welcome back';

  @override
  String get loginSubtitle => 'Sign in to continue learning.';

  @override
  String get registerTitle => 'Create an account';

  @override
  String get registerSubtitle => 'Free, takes one minute.';

  @override
  String get forgotPassword => 'Forgot password?';

  @override
  String get forgotTitle => 'Reset password';

  @override
  String get forgotSubtitle =>
      'We\'ll email you a link. You set the new password on the website.';

  @override
  String get sendLink => 'Send link';

  @override
  String get linkSent => 'Link sent. Check your email.';

  @override
  String get noAccount => 'No account yet? Sign up';

  @override
  String get haveAccount => 'Already have an account? Sign in';

  @override
  String get checkEmail =>
      'Account created. Open your email to confirm, then sign in.';

  @override
  String get errRequired => 'Required';

  @override
  String get errEmail => 'Invalid email';

  @override
  String get errPasswordShort => 'At least 8 characters';

  @override
  String get errInvalidCredentials => 'Wrong email or password.';

  @override
  String get errEmailNotConfirmed =>
      'Email not confirmed yet. Check your inbox.';

  @override
  String get errAlreadyRegistered => 'This email is already registered.';

  @override
  String get errWeakPassword => 'Password is too weak.';

  @override
  String get errRateLimited => 'Too many attempts. Please try again shortly.';

  @override
  String get errGeneric =>
      'Something went wrong. Check your connection and try again.';

  @override
  String get retry => 'Try again';

  @override
  String hello(String name) {
    return 'Hi, $name!';
  }

  @override
  String levelLabel(int level) {
    return 'Level $level';
  }

  @override
  String xpToNext(int current, int needed) {
    return '$current/$needed XP to next level';
  }

  @override
  String get xpWeek => 'XP this week';

  @override
  String get lessonsDone => 'Lessons done';

  @override
  String get bestStreak => 'Best streak';

  @override
  String days(int count) {
    return '$count days';
  }

  @override
  String get badgesTitle => 'Badges';

  @override
  String get coursesTitle => 'Courses';

  @override
  String get allLevels => 'All';

  @override
  String get noCourses => 'No courses yet.';

  @override
  String teacher(String name) {
    return 'Teacher: $name';
  }

  @override
  String lessonCount(int count) {
    return '$count lessons';
  }

  @override
  String minutes(int count) {
    return '$count min';
  }

  @override
  String get freePreview => 'Free';

  @override
  String get comingSoon => 'Coming soon';

  @override
  String get comingSoonBody =>
      'This feature is in progress. Meanwhile, please use the website.';

  @override
  String get language => 'Language';

  @override
  String get notConfiguredTitle => 'App not configured';

  @override
  String get notConfiguredBody =>
      'Run with --dart-define-from-file=env.json (copy env.example.json, fill in the Supabase URL and key).';

  @override
  String get badgeFirstLesson => 'First step';

  @override
  String get badgeFirstLessonHow => 'Finish 1 lesson';

  @override
  String get badgeTenLessons => 'Keen learner';

  @override
  String get badgeTenLessonsHow => 'Finish 10 lessons';

  @override
  String get badgeFiftyLessons => 'True learner';

  @override
  String get badgeFiftyLessonsHow => 'Finish 50 lessons';

  @override
  String get badgePerfectQuiz => 'Perfect score';

  @override
  String get badgePerfectQuizHow => 'Score 100% on a quiz';

  @override
  String get badgeStreak7 => 'Full week';

  @override
  String get badgeStreak7How => 'Study 7 days in a row';

  @override
  String get badgeStreak30 => 'Full month';

  @override
  String get badgeStreak30How => 'Study 30 days in a row';

  @override
  String get badgeFirstCertificate => 'Course graduate';

  @override
  String get badgeFirstCertificateHow => 'Earn your first certificate';

  @override
  String get badgeThreeCertificates => 'Certificate collector';

  @override
  String get badgeThreeCertificatesHow => 'Earn 3 certificates';

  @override
  String get badgeTryoutTaker => 'Exam fighter';

  @override
  String get badgeTryoutTakerHow => 'Submit 1 mock exam';

  @override
  String get badgePractice50 => 'Never give up';

  @override
  String get badgePractice50How => 'Answer 50 practice questions correctly';

  @override
  String get allTime => 'All time';

  @override
  String get markDone => 'Mark as done';

  @override
  String get markUndone => 'Mark as not done';

  @override
  String get nextLesson => 'Next lesson';

  @override
  String get previousLesson => 'Previous';

  @override
  String get finishedCourse => 'Course complete';

  @override
  String get completed => 'Done';

  @override
  String get lessonNotes => 'Lesson notes';

  @override
  String get lessonMaterials => 'Supporting materials';

  @override
  String get downloadFailed =>
      'The file couldn\'t be opened. Please try again.';

  @override
  String get videoUnavailable =>
      'The video for this lesson is not available yet.';

  @override
  String get saveFailed =>
      'Couldn\'t save. Check your connection and try again.';

  @override
  String get lockedTitle => 'This lesson is for subscribers';

  @override
  String get lockedText =>
      'This lesson\'s video, notes and materials are open to subscribers of its level. Lessons marked Free can be watched without a subscription.';

  @override
  String get openOnWebsite => 'View on website';

  @override
  String completedOf(int done, int total) {
    return '$done of $total lessons done';
  }

  @override
  String get startCourse => 'Start learning';

  @override
  String get resumeCourse => 'Continue learning';

  @override
  String get reviewCourse => 'Review course';

  @override
  String get lessonList => 'Lessons';

  @override
  String get next => 'Next';

  @override
  String get quizTitle => 'Quiz';

  @override
  String get takeQuiz => 'Take the quiz';

  @override
  String get retakeQuiz => 'Retake quiz';

  @override
  String quizBest(int score, int total) {
    return 'Best score: $score/$total';
  }

  @override
  String quizCount(int count) {
    return '$count practice questions';
  }

  @override
  String questionNumber(int number) {
    return 'Question $number';
  }

  @override
  String quizProgress(int answered, int total) {
    return '$answered of $total answered';
  }

  @override
  String get checkAnswers => 'Check answers';

  @override
  String get correct => 'Correct';

  @override
  String get wrong => 'Wrong';

  @override
  String get explanation => 'Explanation';

  @override
  String get yourScore => 'Your score';

  @override
  String scoreLine(int score, int total) {
    return '$score of $total correct';
  }

  @override
  String get verdictGreat => 'Perfect! You have mastered this material.';

  @override
  String get verdictGood => 'Nice! Almost there.';

  @override
  String get verdictReview => 'Review the material, then try again.';

  @override
  String get backToCourse => 'Back to course';

  @override
  String get submitFailed =>
      'Couldn\'t send your answers. Check your connection and try again.';

  @override
  String get quizNoAccess => 'This quiz is for subscribers of its level.';

  @override
  String get certificateTitle => 'Certificate';

  @override
  String get viewCertificate => 'View certificate';

  @override
  String get claimCertificate => 'Get certificate';

  @override
  String reqLessons(int done, int total) {
    return 'Finish all lessons ($done/$total)';
  }

  @override
  String reqQuiz(int percent) {
    return 'Score at least $percent% on the quiz';
  }

  @override
  String get certNotComplete => 'Finish all lessons first.';

  @override
  String certQuizRequired(int percent) {
    return 'Your best quiz score hasn\'t reached $percent% yet.';
  }

  @override
  String get certNoAccess => 'You don\'t have access to this course yet.';

  @override
  String get certGeneric =>
      'Couldn\'t create the certificate. Please try again.';

  @override
  String get certHeading => 'Certificate of Completion';

  @override
  String get presentedTo => 'Presented to';

  @override
  String get forCompleting => 'for successfully completing the course';

  @override
  String certQuizScore(int score, int total, int percent) {
    return 'Quiz score: $score/$total ($percent%)';
  }

  @override
  String get issuedOn => 'Issued on';

  @override
  String get certCode => 'Certificate code';

  @override
  String get printOnWebsite => 'Print / save PDF on website';

  @override
  String get copyVerifyLink => 'Copy verification link';

  @override
  String get linkCopied => 'Link copied';

  @override
  String get myCertificates => 'My certificates';

  @override
  String get noCertificates =>
      'No certificates yet. Finish a course to earn one.';
}
