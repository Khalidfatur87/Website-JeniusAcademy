import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:jeniusacademy/core/providers.dart';
import 'package:jeniusacademy/data/engagement_repository.dart';
import 'package:jeniusacademy/data/tryout_repository.dart';
import 'package:jeniusacademy/domain/gamification.dart';
import 'package:jeniusacademy/features/tryout/tryout_take_screen.dart';
import 'package:jeniusacademy/l10n/app_localizations.dart';
import 'package:material_ui/material_ui.dart';

final _start = DateTime.utc(2026, 11, 22, 10);

class _FakeTryout implements TryoutRepository {
  final saves = <Map<String, int>>[];
  Map<String, int>? submitted;

  @override
  Future<TryoutSession> start(String slug) async => TryoutSession(
        startedAt: _start,
        deadline: _start.add(const Duration(minutes: 3)),
        submitted: false,
        answers: const {},
        sections: const [
          TryoutPaperSection(id: 's1', title: {'id': 'Penalaran Umum'}, minutes: 1, questions: [
            TryoutQuestion(id: 'q1', prompt: {'id': 'Soal satu'}, options: ['A1', 'B1']),
          ]),
          TryoutPaperSection(id: 's2', title: {'id': 'Literasi'}, minutes: 2, questions: [
            TryoutQuestion(id: 'q2', prompt: {'id': 'Soal dua'}, options: ['A2', 'B2']),
          ]),
        ],
      );

  @override
  Future<bool> save(String slug, Map<String, int> answers) async {
    saves.add(Map.of(answers));
    return true;
  }

  @override
  Future<TryoutResult> submit(String slug, Map<String, int> answers) async {
    submitted = answers;
    return TryoutResult(
      score: 1, total: 2, submittedAt: _start, answers: answers, sectionScores: const [],
      rank: 1, participants: 1, key: const [], sectionAvg: const {},
    );
  }

  @override
  noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  late DateTime now;
  late _FakeTryout repo;

  Future<void> pump(WidgetTester tester) async {
    await tester.pumpWidget(ProviderScope(
      overrides: [
        currentUserProvider.overrideWith((ref) => Stream.value(null)),
        achievementsProvider.overrideWith((ref) async => const AchievementStats()),
        tryoutRepositoryProvider.overrideWithValue(repo),
        clockProvider.overrideWithValue(() => now),
      ],
      child: MaterialApp(
        locale: const Locale('id'),
        localizationsDelegates: [AppLocalizations.delegate, ...GlobalMaterialLocalizations.delegates],
        supportedLocales: AppLocalizations.supportedLocales,
        home: const TryoutTakeScreen(slug: 'utbk-1'),
      ),
    ));
    await tester.pump();
    await tester.pump();
  }

  setUp(() {
    now = _start.add(const Duration(seconds: 15));
    repo = _FakeTryout();
  });

  testWidgets('timer subtes, simpan otomatis, pindah subtes saat waktu habis, serahkan otomatis',
      (tester) async {
    await pump(tester);
    expect(find.text('Subtes 1 dari 2'), findsOneWidget);
    expect(find.text('00:45'), findsOneWidget);

    await tester.tap(find.text('B1'));
    await tester.pump(const Duration(seconds: 2)); // simpan otomatis 2 detik setelah menjawab
    expect(repo.saves.last, {'q1': 1});

    now = _start.add(const Duration(seconds: 61)); // waktu subtes 1 habis
    await tester.pump(const Duration(seconds: 1));
    expect(find.text('Subtes 2 dari 2'), findsOneWidget);
    expect(find.text('01:59'), findsOneWidget);
    expect(find.text('Soal dua'), findsOneWidget);

    now = _start.add(const Duration(minutes: 3, seconds: 1)); // semua waktu habis
    await tester.pump(const Duration(seconds: 1));
    await tester.pump();
    expect(repo.submitted, {'q1': 1});
  });

  testWidgets('lanjut lebih awal dan serahkan dengan konfirmasi', (tester) async {
    await pump(tester);
    await tester.tap(find.text('Lanjut subtes berikutnya'));
    await tester.pumpAndSettle();
    expect(find.textContaining('Soal kosong: 1'), findsOneWidget);
    await tester.tap(find.text('Lanjut'));
    await tester.pump();
    await tester.pump();
    expect(find.text('Subtes 2 dari 2'), findsOneWidget);
    expect(find.text('02:45'), findsOneWidget, reason: 'subtes 2 tetap berakhir di menit ke-3; sisa subtes 1 hangus');

    await tester.tap(find.text('A2'));
    await tester.tap(find.text('Serahkan jawaban'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Lanjut'));
    await tester.pump();
    await tester.pump();
    expect(repo.submitted, {'q2': 0});
  });
}
