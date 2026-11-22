import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:jeniusacademy/core/providers.dart';
import 'package:jeniusacademy/data/parent_repository.dart';
import 'package:jeniusacademy/features/parent/parent_screen.dart';
import 'package:jeniusacademy/l10n/app_localizations.dart';
import 'package:material_ui/material_ui.dart';

class _FakeParent implements ParentRepository {
  bool linked = false;

  @override
  Future<String> redeem(String code) async {
    if (code.trim().toUpperCase() != 'K0DE1234') {
      throw const ParentLinkException(ParentLinkError.invalidCode);
    }
    linked = true;
    return 'Rina';
  }

  @override
  Future<List<ChildSummary>> children() async => linked
      ? [
          ChildSummary.fromJson({
            'student_id': 's1',
            'name': 'Rina',
            'lessons_total': 34,
            'lessons_week': 6,
            'quizzes_week': 2,
            'avg_quiz_percent': 85,
            'last_active': '2026-11-22T10:00:00Z',
            'active_days': ['2026-11-22', '2026-11-21', '2026-11-20'],
            'courses': [
              {
                'slug': 'mat',
                'title': {'id': 'Matematika'},
                'done': 3,
                'total': 7,
              },
            ],
          }),
        ]
      : const [];

  @override
  noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  testWidgets('menautkan anak dengan kode lalu melihat ringkasannya', (
    tester,
  ) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          currentUserProvider.overrideWith((ref) => Stream.value(null)),
          clockProvider.overrideWithValue(() => DateTime(2026, 11, 22, 19)),
          parentRepositoryProvider.overrideWithValue(_FakeParent()),
        ],
        child: MaterialApp(
          locale: const Locale('id'),
          localizationsDelegates: [
            AppLocalizations.delegate,
            ...GlobalMaterialLocalizations.delegates,
          ],
          supportedLocales: AppLocalizations.supportedLocales,
          home: const ParentScreen(),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.textContaining('Belum ada anak yang tertaut'), findsOneWidget);

    await tester.enterText(find.byType(TextField), 'salah');
    await tester.tap(find.text('Tautkan'));
    await tester.pumpAndSettle();
    expect(
      find.text('Kode tidak ditemukan atau sudah kedaluwarsa.'),
      findsOneWidget,
    );

    await tester.enterText(find.byType(TextField), 'k0de1234');
    await tester.tap(find.text('Tautkan'));
    await tester.pumpAndSettle();
    expect(find.text('Berhasil tertaut dengan Rina.'), findsOneWidget);
    expect(
      find.text('3 hari'),
      findsOneWidget,
      reason: 'streak dari tanggal aktif',
    );
    expect(find.text('85%'), findsOneWidget);
    expect(find.text('Matematika'), findsOneWidget);
    expect(find.text('3/7'), findsOneWidget);
  });
}
