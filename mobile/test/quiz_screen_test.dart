import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:jeniusacademy/core/providers.dart';
import 'package:jeniusacademy/data/course_repository.dart';
import 'package:jeniusacademy/data/engagement_repository.dart';
import 'package:jeniusacademy/data/quiz_repository.dart';
import 'package:jeniusacademy/domain/gamification.dart';
import 'package:jeniusacademy/domain/quiz.dart';
import 'package:jeniusacademy/features/quiz/quiz_screen.dart';
import 'package:jeniusacademy/l10n/app_localizations.dart';
import 'package:material_ui/material_ui.dart';

class _FakeQuiz implements QuizRepository {
  Map<String, int>? submitted;

  @override
  Future<List<QuizQuestion>> questions(String slug) async => const [
        QuizQuestion(id: 'q1', prompt: {'id': '2 + 2 = ?'}, options: ['3', '4']),
        QuizQuestion(id: 'q2', prompt: {'id': 'Ibu kota Indonesia?'}, options: ['Jakarta', 'Bandung']),
      ];

  /// Penilaian "server": kunci q1 = 1, q2 = 0.
  @override
  Future<QuizResult> submit(String slug, Map<String, int> answers) async {
    submitted = answers;
    const key = {'q1': 1, 'q2': 0};
    final score = key.entries.where((e) => answers[e.key] == e.value).length;
    return QuizResult(
      score: score,
      total: 2,
      recorded: true,
      results: {
        'q1': const QuestionResult(id: 'q1', answer: 1, explanation: {'id': 'Dua tambah dua sama dengan empat.'}),
        'q2': const QuestionResult(id: 'q2', answer: 0, explanation: null),
      },
    );
  }

  @override
  Future<List<Attempt>> attempts() async => const [];

  @override
  noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  testWidgets('menjawab, menyerahkan, lalu melihat skor & pembahasan', (tester) async {
    final repo = _FakeQuiz();
    await tester.pumpWidget(ProviderScope(
      overrides: [
        currentUserProvider.overrideWith((ref) => Stream.value(null)),
        achievementsProvider.overrideWith((ref) async => const AchievementStats()),
        courseProvider.overrideWith((ref, slug) async => null),
        quizRepositoryProvider.overrideWithValue(repo),
      ],
      child: MaterialApp(
        locale: const Locale('id'),
        localizationsDelegates: [AppLocalizations.delegate, ...GlobalMaterialLocalizations.delegates],
        supportedLocales: AppLocalizations.supportedLocales,
        home: const QuizScreen(slug: 'mat'),
      ),
    ));
    await tester.pumpAndSettle();

    expect(find.text('0 dari 2 soal terjawab'), findsOneWidget);
    FilledButton submit() => tester.widget<FilledButton>(find.widgetWithText(FilledButton, 'Periksa jawaban'));
    expect(submit().onPressed, isNull, reason: 'belum semua soal terjawab');

    await tester.tap(find.text('4'));
    await tester.pump();
    expect(submit().onPressed, isNull);
    await tester.tap(find.text('Bandung')); // salah
    await tester.pump();
    expect(find.text('2 dari 2 soal terjawab'), findsOneWidget);

    await tester.tap(find.text('Periksa jawaban'));
    await tester.pumpAndSettle();

    expect(repo.submitted, {'q1': 1, 'q2': 1});
    expect(find.text('50%'), findsOneWidget);
    expect(find.text('1 dari 2 benar'), findsOneWidget);
    expect(find.text('Benar'), findsOneWidget);
    expect(find.text('Salah'), findsOneWidget);
    expect(find.text('Dua tambah dua sama dengan empat.'), findsOneWidget);
    expect(find.text('Ulangi kuis'), findsOneWidget);

    await tester.tap(find.text('Ulangi kuis'));
    await tester.pumpAndSettle();
    expect(find.text('0 dari 2 soal terjawab'), findsOneWidget);
  });
}
