import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:jeniusacademy/data/discussion_repository.dart';
import 'package:jeniusacademy/features/discussion/discussion_screen.dart';
import 'package:jeniusacademy/l10n/app_localizations.dart';
import 'package:material_ui/material_ui.dart';

class _MemoryDiscussion implements DiscussionRepository {
  final items = <LessonComment>[];

  @override
  Future<List<LessonComment>> list(String slug, String lessonId) async =>
      List.of(items);

  @override
  Future<bool> post(
    String slug,
    String lessonId,
    String body, {
    String? parentId,
  }) async {
    if (body.trim().isEmpty) return false;
    items.add(
      LessonComment(
        id: 'c${items.length}',
        parentId: parentId,
        body: body.trim(),
        createdAt: DateTime(2026, 11, 22),
        authorName: 'Rina',
        authorAvatar: null,
        authorRole: 'student',
        isMine: true,
        canDelete: true,
      ),
    );
    return true;
  }

  @override
  Future<void> delete(String id) async => items.removeWhere((c) => c.id == id);
}

void main() {
  testWidgets('bertanya, membalas, dan menghapus', (tester) async {
    final repo = _MemoryDiscussion();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [discussionRepositoryProvider.overrideWithValue(repo)],
        child: MaterialApp(
          locale: const Locale('id'),
          localizationsDelegates: [
            AppLocalizations.delegate,
            ...GlobalMaterialLocalizations.delegates,
          ],
          supportedLocales: AppLocalizations.supportedLocales,
          home: const DiscussionScreen(slug: 'mat', lessonId: 'a'),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(
      find.text('Belum ada pertanyaan. Jadilah yang pertama bertanya.'),
      findsOneWidget,
    );

    await tester.enterText(find.byType(TextField), '  Kenapa a ≠ 0?  ');
    await tester.tap(find.byTooltip('Kirim'));
    await tester.pumpAndSettle();
    expect(find.text('Kenapa a ≠ 0?'), findsOneWidget);

    await tester.tap(find.text('Balas'));
    await tester.pump();
    expect(find.text('Membalas Rina'), findsOneWidget);
    await tester.enterText(
      find.byType(TextField),
      'Supaya tetap fungsi kuadrat.',
    );
    await tester.tap(find.byTooltip('Kirim'));
    await tester.pumpAndSettle();
    expect(repo.items.last.parentId, 'c0');
    expect(find.text('Supaya tetap fungsi kuadrat.'), findsOneWidget);

    await tester.tap(find.byTooltip('Hapus').last);
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(FilledButton, 'Hapus'));
    await tester.pumpAndSettle();
    expect(find.text('Supaya tetap fungsi kuadrat.'), findsNothing);
  });
}
