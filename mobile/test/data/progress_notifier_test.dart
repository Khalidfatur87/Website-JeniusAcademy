import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:jeniusacademy/core/providers.dart';
import 'package:jeniusacademy/data/engagement_repository.dart';
import 'package:jeniusacademy/data/lesson_repository.dart';
import 'package:jeniusacademy/domain/gamification.dart';

class _FakeRepo implements ProgressRepository {
  _FakeRepo(this.initial);

  final ProgressMap initial;
  bool fail = false;
  final calls = <(String, String, bool)>[];

  @override
  Future<ProgressMap> load() async => initial;

  @override
  Future<void> setDone(String slug, String lessonId, bool done) async {
    calls.add((slug, lessonId, done));
    if (fail) throw Exception('offline');
  }
}

ProviderContainer _container(_FakeRepo repo) => ProviderContainer(
      overrides: [
        progressRepositoryProvider.overrideWithValue(repo),
        currentUserProvider.overrideWith((ref) => Stream.value(null)),
        achievementsProvider.overrideWith((ref) async => const AchievementStats()),
      ],
    );

void main() {
  test('menandai selesai lalu belum selesai', () async {
    final repo = _FakeRepo({
      'mat': {'a'},
    });
    final c = _container(repo);
    addTearDown(c.dispose);
    expect(await c.read(progressProvider.future), {
      'mat': {'a'},
    });

    final n = c.read(progressProvider.notifier);
    expect(await n.setDone('mat', 'b', true), isTrue);
    expect(c.read(progressProvider).value!['mat'], {'a', 'b'});

    expect(await n.setDone('mat', 'a', false), isTrue);
    expect(c.read(progressProvider).value!['mat'], {'b'});
    expect(repo.calls, [('mat', 'b', true), ('mat', 'a', false)]);
  });

  test('jika server gagal, status dikembalikan', () async {
    final repo = _FakeRepo({})..fail = true;
    final c = _container(repo);
    addTearDown(c.dispose);
    await c.read(progressProvider.future);

    expect(await c.read(progressProvider.notifier).setDone('mat', 'a', true), isFalse);
    expect(c.read(progressProvider).value!['mat'], isNull);
  });

  test('LessonContent tanpa hak akses tidak membawa isi', () {
    final locked = LessonContent.fromJson({'access': false});
    expect(locked.access, isFalse);
    expect(locked.youtubeId, '');

    final open = LessonContent.fromJson({
      'access': true,
      'youtube_id': 'abc',
      'notes': {'id': 'Catatan'},
      'materials': [
        {'id': '1', 'title': 'Ringkasan.pdf', 'path': 'mat/a/1.pdf', 'size': 2048},
      ],
    });
    expect(open.youtubeId, 'abc');
    expect(open.materials.single.size, 2048);
  });
}
