import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:jeniusacademy/core/providers.dart';
import 'package:jeniusacademy/data/classes_repository.dart';
import 'package:jeniusacademy/features/classes/classes_screen.dart';
import 'package:jeniusacademy/l10n/app_localizations.dart';
import 'package:material_ui/material_ui.dart';

class _FakeClasses implements ClassesRepository {
  bool joined = false;

  @override
  Future<String> join(String code) async {
    if (code.trim().toUpperCase() != 'ABC123') {
      throw const JoinException(JoinError.invalidCode);
    }
    joined = true;
    return 'XII IPA 1';
  }

  @override
  Future<List<MyClassroom>> myClassrooms() async =>
      joined ? const [MyClassroom(id: 'c1', name: 'XII IPA 1')] : const [];

  @override
  Future<List<Assignment>> myAssignments() async => joined
      ? [
          Assignment.fromJson({
            'id': 'a1',
            'classroom_name': 'XII IPA 1',
            'title': 'Kuis fungsi',
            'instructions': 'Minimal 70',
            'kind': 'quiz',
            'course_slug': 'mat',
            'course_title': {'id': 'Matematika'},
            'lesson_id': null,
            'due_at': '2026-11-20T10:00:00Z',
            'status': {'done': false},
          }),
        ]
      : const [];

  @override
  Future<void> leave(String classroomId) async => joined = false;
}

void main() {
  testWidgets(
    'kode salah ditolak; kode benar menampilkan tugas lewat tenggat',
    (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            currentUserProvider.overrideWith((ref) => Stream.value(null)),
            clockProvider.overrideWithValue(() => DateTime.utc(2026, 11, 22)),
            classesRepositoryProvider.overrideWithValue(_FakeClasses()),
          ],
          child: MaterialApp(
            locale: const Locale('id'),
            localizationsDelegates: [
              AppLocalizations.delegate,
              ...GlobalMaterialLocalizations.delegates,
            ],
            supportedLocales: AppLocalizations.supportedLocales,
            home: const ClassesScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Belum ada tugas.'), findsOneWidget);

      await tester.enterText(find.byType(TextField), 'salah');
      await tester.tap(find.text('Gabung'));
      await tester.pumpAndSettle();
      expect(find.text('Kode kelas tidak ditemukan.'), findsOneWidget);

      await tester.enterText(find.byType(TextField), 'abc123');
      await tester.tap(find.text('Gabung'));
      await tester.pumpAndSettle();
      expect(find.text('Berhasil bergabung ke XII IPA 1.'), findsOneWidget);
      expect(find.text('Kuis fungsi'), findsOneWidget);
      expect(find.textContaining('Lewat tenggat'), findsOneWidget);
      expect(find.text('Kelas yang diikuti'), findsOneWidget);
    },
  );
}
