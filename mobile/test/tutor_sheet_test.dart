import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:jeniusacademy/data/tutor_repository.dart';
import 'package:jeniusacademy/features/tutor/tutor_sheet.dart';
import 'package:jeniusacademy/l10n/app_localizations.dart';
import 'package:material_ui/material_ui.dart';

class _FakeTutor implements TutorRepository {
  final histories = <List<TutorTurn>>[];

  @override
  Stream<String> askLesson({
    required String slug,
    required String lessonId,
    required String question,
    required List<TutorTurn> history,
    required String locale,
  }) {
    histories.add(history);
    if (question == 'kuota?') {
      return Stream.error(const TutorException(TutorError.quota));
    }
    return Stream.fromIterable(['Jawab: ', question.toUpperCase()]);
  }

  @override
  noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  testWidgets('bertanya, jawaban tampil, riwayat ikut dikirim; galat kuota', (
    tester,
  ) async {
    final repo = _FakeTutor();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [tutorRepositoryProvider.overrideWithValue(repo)],
        child: MaterialApp(
          locale: const Locale('id'),
          localizationsDelegates: [
            AppLocalizations.delegate,
            ...GlobalMaterialLocalizations.delegates,
          ],
          supportedLocales: AppLocalizations.supportedLocales,
          home: const Scaffold(
            body: TutorSheet(slug: 'mat', lessonId: 'a'),
          ),
        ),
      ),
    );

    await tester.enterText(find.byType(TextField), 'satu');
    await tester.tap(find.byTooltip('Kirim'));
    await tester.pumpAndSettle();
    expect(find.text('Jawab: SATU'), findsOneWidget);

    await tester.enterText(find.byType(TextField), 'dua');
    await tester.tap(find.byTooltip('Kirim'));
    await tester.pumpAndSettle();
    expect(repo.histories.last, [
      (role: 'user', content: 'satu'),
      (role: 'assistant', content: 'Jawab: SATU'),
    ]);

    await tester.enterText(find.byType(TextField), 'kuota?');
    await tester.tap(find.byTooltip('Kirim'));
    await tester.pumpAndSettle();
    expect(
      find.text('Kuota tutor AI hari ini sudah habis. Coba lagi besok.'),
      findsOneWidget,
    );
    expect(
      find.text('kuota?'),
      findsNothing,
      reason: 'pertanyaan gagal tidak masuk riwayat',
    );
  });
}
