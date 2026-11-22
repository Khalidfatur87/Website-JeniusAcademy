import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:jeniusacademy/core/providers.dart';
import 'package:jeniusacademy/data/engagement_repository.dart';
import 'package:jeniusacademy/data/practice_repository.dart';
import 'package:jeniusacademy/domain/gamification.dart';
import 'package:jeniusacademy/features/practice/practice_screen.dart';
import 'package:jeniusacademy/l10n/app_localizations.dart';
import 'package:material_ui/material_ui.dart';

class _FakePractice implements PracticeRepository {
  int due = 2;
  final answered = <String, int>{};

  @override
  Future<PracticeSummary> summary() async => PracticeSummary(due: due, tracked: 3);

  @override
  Future<List<PracticeItem>> queue({int limit = 10}) async => const [
        PracticeItem(id: 'a', courseTitle: {'id': 'Matematika'}, prompt: {'id': '3 × 3 = ?'}, options: ['6', '9'], box: 4),
        PracticeItem(id: 'b', courseTitle: {'id': 'IPA'}, prompt: {'id': 'Air mendidih pada …'}, options: ['50 °C', '100 °C'], box: 0),
      ];

  /// Kunci: a → 1, b → 1. Soal a sudah di kotak 4, jadi benar = dikuasai.
  @override
  Future<PracticeAnswer> answer(String questionId, int choice) async {
    answered[questionId] = choice;
    due--;
    final correct = choice == 1;
    return PracticeAnswer(correct: correct, answer: 1, explanation: null, mastered: correct && questionId == 'a');
  }

  @override
  noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  testWidgets('sesi latihan: jawab, lihat hasil, selesai', (tester) async {
    final repo = _FakePractice();
    await tester.pumpWidget(ProviderScope(
      overrides: [
        currentUserProvider.overrideWith((ref) => Stream.value(null)),
        achievementsProvider.overrideWith((ref) async => const AchievementStats()),
        practiceRepositoryProvider.overrideWithValue(repo),
      ],
      child: MaterialApp(
        locale: const Locale('id'),
        localizationsDelegates: [AppLocalizations.delegate, ...GlobalMaterialLocalizations.delegates],
        supportedLocales: AppLocalizations.supportedLocales,
        home: const PracticeScreen(),
      ),
    ));
    await tester.pumpAndSettle();
    expect(find.text('2 soal siap diulang'), findsOneWidget);

    await tester.tap(find.text('Mulai latihan'));
    await tester.pumpAndSettle();
    expect(find.text('Soal 1 dari 2'), findsOneWidget);

    await tester.tap(find.text('9'));
    await tester.pump();
    await tester.tap(find.text('Periksa'));
    await tester.pumpAndSettle();
    expect(find.text('Dikuasai! Soal ini keluar dari antrean.'), findsOneWidget);

    await tester.tap(find.text('Berikutnya'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('50 °C')); // salah
    await tester.pump();
    await tester.tap(find.text('Periksa'));
    await tester.pumpAndSettle();
    expect(find.text('Belum tepat.'), findsOneWidget);

    await tester.tap(find.text('Berikutnya'));
    await tester.pumpAndSettle();
    expect(find.text('Sesi selesai'), findsOneWidget);
    expect(find.text('1 dari 2 benar.'), findsOneWidget);
    expect(find.text('1 soal dikuasai.'), findsOneWidget);
    expect(repo.answered, {'a': 1, 'b': 0});
  });
}
