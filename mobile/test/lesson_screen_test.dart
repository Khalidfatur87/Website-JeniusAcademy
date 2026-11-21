import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:jeniusacademy/core/providers.dart';
import 'package:jeniusacademy/data/course_repository.dart';
import 'package:jeniusacademy/data/engagement_repository.dart';
import 'package:jeniusacademy/data/lesson_repository.dart';
import 'package:jeniusacademy/domain/gamification.dart';
import 'package:jeniusacademy/features/lesson/lesson_screen.dart';
import 'package:jeniusacademy/l10n/app_localizations.dart';
import 'package:material_ui/material_ui.dart';

class _MemoryProgress implements ProgressRepository {
  final saved = <String>{};

  @override
  Future<ProgressMap> load() async => {};

  @override
  Future<void> setDone(String slug, String lessonId, bool done) async =>
      done ? saved.add(lessonId) : saved.remove(lessonId);
}

const _lessons = [
  LessonSummary(id: 'a', title: {'id': 'Pengenalan'}, minutes: 8, freePreview: true),
  LessonSummary(id: 'b', title: {'id': 'Lanjutan'}, minutes: 12, freePreview: false),
];

Widget _app(LessonContent content, _MemoryProgress repo) => ProviderScope(
      overrides: [
        currentUserProvider.overrideWith((ref) => Stream.value(null)),
        achievementsProvider.overrideWith((ref) async => const AchievementStats()),
        progressRepositoryProvider.overrideWithValue(repo),
        lessonsProvider.overrideWith((ref, slug) async => _lessons),
        lessonContentProvider.overrideWith((ref, key) async => content),
        videoViewProvider.overrideWithValue((id) => Text('VIDEO $id')),
      ],
      child: MaterialApp(
        locale: const Locale('id'),
        localizationsDelegates: [AppLocalizations.delegate, ...GlobalMaterialLocalizations.delegates],
        supportedLocales: AppLocalizations.supportedLocales,
        home: const LessonScreen(slug: 'mat', lessonId: 'a'),
      ),
    );

void main() {
  testWidgets('pelajaran terkunci tidak menampilkan video', (tester) async {
    await tester.pumpWidget(_app(const LessonContent(access: false), _MemoryProgress()));
    await tester.pumpAndSettle();
    expect(find.text('Pelajaran ini khusus pelanggan'), findsOneWidget);
    expect(find.textContaining('VIDEO'), findsNothing);
    expect(find.text('Tandai selesai'), findsNothing);
  });

  testWidgets('pelajaran terbuka: video, catatan, materi, tandai selesai', (tester) async {
    final repo = _MemoryProgress();
    await tester.pumpWidget(_app(
      const LessonContent(
        access: true,
        youtubeId: 'abc123',
        notes: {'id': 'Fungsi memetakan x ke y.'},
        materials: [LessonMaterial(title: 'Ringkasan.pdf', path: 'p/1.pdf', size: 2048)],
      ),
      repo,
    ));
    await tester.pumpAndSettle();

    expect(find.text('VIDEO abc123'), findsOneWidget);
    expect(find.text('Fungsi memetakan x ke y.'), findsOneWidget);
    expect(find.text('Ringkasan.pdf'), findsOneWidget);
    expect(find.text('2 KB'), findsOneWidget);
    expect(find.text('Berikutnya'), findsOneWidget);

    await tester.tap(find.text('Tandai selesai'));
    await tester.pumpAndSettle();
    expect(repo.saved, {'a'});
    expect(find.text('Selesai'), findsOneWidget);
  });
}
