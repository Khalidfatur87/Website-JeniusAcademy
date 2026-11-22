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

  @override
  String get editName => 'Edit name';

  @override
  String get save => 'Save';

  @override
  String get cancel => 'Cancel';

  @override
  String get changePhoto => 'Change photo';

  @override
  String get choosePhoto => 'Choose from gallery';

  @override
  String get removePhoto => 'Remove photo';

  @override
  String get weeklyGoal => 'Weekly goal';

  @override
  String weeklyGoalValue(int count) {
    return '$count lessons per week';
  }

  @override
  String get showOnLeaderboard => 'Show my name on the leaderboard';

  @override
  String get showOnLeaderboardHint =>
      'If off, other students won\'t see your name.';

  @override
  String get errNameRequired => 'Name is required.';

  @override
  String get errNameTooLong => 'Name can be at most 80 characters.';

  @override
  String get errFileType => 'Use a PNG, JPG or WEBP photo.';

  @override
  String get errFileSize => 'Photo must be 2 MB or smaller.';

  @override
  String get saved => 'Saved';

  @override
  String get practiceTitle => 'Smart practice';

  @override
  String get practiceSubtitle =>
      'Quiz questions you got wrong come back at the right time until you master them.';

  @override
  String practiceDue(int count) {
    return '$count questions ready to review';
  }

  @override
  String get practiceIntro =>
      'Each session has up to 10 questions. Right → it returns in a few days; wrong → tomorrow.';

  @override
  String get practiceNothingDue => 'Nothing to review right now';

  @override
  String get practiceNothingTracked =>
      'Take a quiz in any course. Questions you miss show up here automatically.';

  @override
  String practiceNextDue(String date) {
    return 'The next question is due $date.';
  }

  @override
  String get practiceBrowse => 'Browse courses';

  @override
  String get practiceStart => 'Start practice';

  @override
  String get practiceAgain => 'Practice again';

  @override
  String practiceProgress(int current, int total) {
    return 'Question $current of $total';
  }

  @override
  String get practiceCheck => 'Check';

  @override
  String get practiceCorrect => 'Correct!';

  @override
  String get practiceWrong => 'Not quite.';

  @override
  String get practiceMastered => 'Mastered! This question leaves your queue.';

  @override
  String get practiceDone => 'Session complete';

  @override
  String practiceScore(int correct, int total) {
    return '$correct of $total correct.';
  }

  @override
  String practiceMasteredCount(int count) {
    return '$count questions mastered.';
  }

  @override
  String get tryoutTitle => 'UTBK mock exams';

  @override
  String get tryoutSubtitle =>
      'Timed practice exams per section, with scores, rankings and explanations.';

  @override
  String get tryoutEmpty => 'No mock exams are open yet.';

  @override
  String tryoutSectionCount(int count) {
    return '$count sections';
  }

  @override
  String tryoutTotalTime(int count) {
    return 'Total time $count min';
  }

  @override
  String tryoutOpensAt(String date) {
    return 'Opens $date';
  }

  @override
  String tryoutClosesAt(String date) {
    return 'Closes $date';
  }

  @override
  String get tryoutWindowOpen => 'Open';

  @override
  String get tryoutWindowUpcoming => 'Opening soon';

  @override
  String get tryoutWindowClosed => 'Closed';

  @override
  String get tryoutSections => 'Sections';

  @override
  String get tryoutRule1 =>
      'Sections run in order, each with its own timer; you cannot go back to a finished section.';

  @override
  String get tryoutRule2 =>
      'Answers save automatically. If you lose connection, open this exam again to continue.';

  @override
  String get tryoutRule3 =>
      'When time runs out, your answers are submitted. Only one attempt counts for the ranking.';

  @override
  String get tryoutStart => 'Start exam';

  @override
  String get tryoutContinue => 'Continue exam';

  @override
  String get tryoutDone => 'Done';

  @override
  String get tryoutOneAttempt =>
      'You only get one attempt. Make sure your connection is stable before starting.';

  @override
  String tryoutSectionOf(int current, int total) {
    return 'Section $current of $total';
  }

  @override
  String tryoutAnsweredOf(int answered, int total) {
    return '$answered of $total answered';
  }

  @override
  String get tryoutSaving => 'Saving…';

  @override
  String get tryoutSaved => 'Saved';

  @override
  String get tryoutSaveFailed => 'Couldn\'t save, will retry';

  @override
  String get tryoutNextSection => 'Next section';

  @override
  String get tryoutSubmit => 'Submit answers';

  @override
  String tryoutConfirmNext(int count) {
    return 'Go to the next section? You can\'t come back to this one. Unanswered: $count.';
  }

  @override
  String tryoutConfirmSubmit(int count) {
    return 'Submit all answers now? They can\'t be changed afterwards. Unanswered: $count.';
  }

  @override
  String get tryoutSubmitting => 'Submitting answers…';

  @override
  String get tryoutErrNoAccess =>
      'This exam is part of a paid plan. Subscribe to take it.';

  @override
  String get tryoutErrClosed => 'This exam is not open right now.';

  @override
  String get tryoutErrNotSignedIn => 'Sign in first to take the exam.';

  @override
  String get tryoutErrGeneric => 'Couldn\'t load the exam. Please try again.';

  @override
  String get tryoutYourResult => 'Your result';

  @override
  String tryoutRank(int rank, int participants) {
    return 'Rank $rank of $participants';
  }

  @override
  String get tryoutFocus => 'Worth reviewing';

  @override
  String get tryoutAllGood => 'Every section looks good. Keep it up!';

  @override
  String get tryoutPerSection => 'Score per section';

  @override
  String tryoutAverage(int percent) {
    return 'participant average $percent%';
  }

  @override
  String get tryoutReview => 'Explanations';

  @override
  String get tryoutUnanswered => 'Not answered';

  @override
  String get tryoutLeaderboard => 'Ranking';

  @override
  String get tryoutLeaderboardEmpty => 'Nobody has submitted yet.';

  @override
  String get tryoutHiddenName => 'Participant';

  @override
  String get tryoutYou => 'you';

  @override
  String tryoutSubmittedOn(String date) {
    return 'Submitted $date';
  }

  @override
  String get continueAction => 'Continue';

  @override
  String get quickLinks => 'More features';

  @override
  String get liveTitle => 'Live classes';

  @override
  String get classesTitle => 'School classes';

  @override
  String get discussionTitle => 'Discussion';

  @override
  String get discussionAsk => 'Write your question about this lesson…';

  @override
  String get discussionReplyHint => 'Write an answer…';

  @override
  String get discussionReply => 'Reply';

  @override
  String get discussionEmpty => 'No questions yet. Be the first to ask.';

  @override
  String get discussionFailed => 'Couldn\'t send. Please try again.';

  @override
  String get discussionDelete => 'Delete';

  @override
  String get discussionConfirmDelete => 'Delete this post?';

  @override
  String get discussionTeacher => 'Teacher';

  @override
  String discussionReplyingTo(String name) {
    return 'Replying to $name';
  }

  @override
  String get discussionOpen => 'Lesson discussion';

  @override
  String get send => 'Send';

  @override
  String get liveSubtitle =>
      'Learn live with a teacher. Recordings can be watched again.';

  @override
  String get liveUpcoming => 'Upcoming';

  @override
  String get liveNoUpcoming => 'No live classes scheduled yet.';

  @override
  String get livePast => 'Past recordings';

  @override
  String liveHost(String name) {
    return 'With $name';
  }

  @override
  String get livePhaseUpcoming => 'Upcoming';

  @override
  String get livePhaseSoon => 'Starting soon';

  @override
  String get livePhaseLive => 'Live now';

  @override
  String get livePhaseEnded => 'Ended';

  @override
  String get liveAddToCalendar => 'Add to calendar';

  @override
  String get liveJoin => 'Join live class';

  @override
  String get liveLinkLater =>
      'The join button appears 15 minutes before the class starts.';

  @override
  String get liveLocked => 'This live class is for subscribers of its level.';

  @override
  String get liveRecording => 'Recording';

  @override
  String get liveNoRecording => 'No recording yet.';

  @override
  String get classesSubtitle =>
      'Join your teacher\'s class and complete its assignments here.';

  @override
  String get classesCode => 'Class code from your teacher';

  @override
  String get classesJoin => 'Join';

  @override
  String classesJoined(String name) {
    return 'Joined $name.';
  }

  @override
  String get classesErrInvalid => 'Class code not found.';

  @override
  String get classesErrOwn => 'You are the teacher of this class.';

  @override
  String get classesErrGeneric => 'Couldn\'t join. Please try again.';

  @override
  String get classesTodo => 'Assignments';

  @override
  String get classesDone => 'Done';

  @override
  String get classesNoTasks => 'No assignments yet.';

  @override
  String get classesAllDone => 'All assignments done. Great job!';

  @override
  String get classesKindLesson => 'Watch a lesson';

  @override
  String get classesKindQuiz => 'Take a quiz';

  @override
  String get classesKindCourse => 'Finish a course';

  @override
  String classesDue(String date) {
    return 'Due $date';
  }

  @override
  String classesOverdue(String date) {
    return 'Overdue since $date';
  }

  @override
  String get classesNoDue => 'No due date';

  @override
  String classesScore(int percent) {
    return 'score $percent%';
  }

  @override
  String get classesStart => 'Start';

  @override
  String get classesOpen => 'Open';

  @override
  String get classesMine => 'My classes';

  @override
  String get classesLeave => 'Leave';

  @override
  String classesConfirmLeave(String name) {
    return 'Leave $name?';
  }

  @override
  String get tutorTitle => 'Ask AI';

  @override
  String get tutorSubtitle =>
      'An AI tutor answers your questions about this lesson.';

  @override
  String get tutorName => 'Tutor Jenius';

  @override
  String get tutorYou => 'You';

  @override
  String get tutorEmpty =>
      'For example: \"Why do we divide by two?\" or \"Give me one more practice question.\"';

  @override
  String get tutorPlaceholder => 'Type your question…';

  @override
  String get tutorThinking => 'Thinking…';

  @override
  String get tutorDisclaimer =>
      'AI answers can be wrong. Double-check with the material or ask a teacher in the Discussion.';

  @override
  String get tutorExplain => 'Explain with AI';

  @override
  String get tutorErrInvalid => 'That question isn\'t valid.';

  @override
  String get tutorErrNotSignedIn => 'Log in first to use the AI tutor.';

  @override
  String get tutorErrNoAccess => 'You don\'t have access to this material yet.';

  @override
  String get tutorErrQuota =>
      'You\'ve used today\'s AI tutor limit. Try again tomorrow.';

  @override
  String get tutorErrNotConfigured => 'The AI tutor isn\'t enabled yet.';

  @override
  String get tutorErrGeneric =>
      'The AI tutor can\'t be reached right now. Please try again.';
}
