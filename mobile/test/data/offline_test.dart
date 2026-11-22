import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:jeniusacademy/core/offline.dart';
import 'package:jeniusacademy/core/providers.dart';
import 'package:jeniusacademy/data/downloads_io.dart';
import 'package:jeniusacademy/data/engagement_repository.dart';
import 'package:jeniusacademy/data/lesson_repository.dart';
import 'package:jeniusacademy/domain/gamification.dart';
import 'package:shared_preferences/shared_preferences.dart';

class _FlakyProgress implements ProgressRepository {
  bool online = true;
  final server = <String, Set<String>>{};

  void _check() {
    if (!online) {
      throw http.ClientException('SocketException: Failed host lookup');
    }
  }

  @override
  Future<ProgressMap> load() async {
    _check();
    return {
      for (final e in server.entries) e.key: {...e.value},
    };
  }

  @override
  Future<void> setDone(String slug, String lessonId, bool done) async {
    _check();
    final s = server[slug] ??= {};
    done ? s.add(lessonId) : s.remove(lessonId);
  }
}

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  test(
    'OfflineCache: pakai salinan terakhir hanya bila galat jaringan',
    () async {
      final prefs = await SharedPreferences.getInstance();
      final offline = <bool>[];
      final cache = OfflineCache(prefs, offline.add);

      expect(await cache.read<List<dynamic>>('k', () async => [1, 2]), [1, 2]);
      expect(
        await cache.read<List<dynamic>>(
          'k',
          () => Future.error(http.ClientException('offline')),
        ),
        [1, 2],
      );
      expect(offline, [false, true]);
      await expectLater(
        cache.read<List<dynamic>>(
          'k',
          () => Future.error(StateError('ditolak')),
        ),
        throwsStateError,
      );
      await expectLater(
        cache.read<List<dynamic>>(
          'baru',
          () => Future.error(http.ClientException('offline')),
        ),
        throwsA(isA<http.ClientException>()),
        reason: 'tanpa salinan, galat diteruskan',
      );
    },
  );

  test(
    'progres offline masuk antrean, tetap tampil, lalu terkirim saat online',
    () async {
      final prefs = await SharedPreferences.getInstance();
      final repo = _FlakyProgress()..server['mat'] = {'a'};
      ProviderContainer make() => ProviderContainer(
        overrides: [
          preferencesProvider.overrideWithValue(prefs),
          progressRepositoryProvider.overrideWithValue(repo),
          currentUserProvider.overrideWith((ref) => Stream.value(null)),
          achievementsProvider.overrideWith(
            (ref) async => const AchievementStats(),
          ),
        ],
      );

      var c = make();
      expect((await c.read(progressProvider.future))['mat'], {'a'});

      repo.online = false;
      expect(
        await c.read(progressProvider.notifier).setDone('mat', 'b', true),
        isTrue,
      );
      expect(c.read(progressProvider).value!['mat'], {'a', 'b'});
      expect(repo.server['mat'], {'a'}, reason: 'belum terkirim');
      c.dispose();

      // Aplikasi dibuka ulang masih offline: data tersimpan + antrean tetap tampil.
      c = make();
      expect((await c.read(progressProvider.future))['mat'], {'a', 'b'});
      c.dispose();

      // Online lagi: antrean dikirim saat progres dimuat.
      repo.online = true;
      c = make();
      expect((await c.read(progressProvider.future))['mat'], {'a', 'b'});
      expect(repo.server['mat'], {'a', 'b'});
      c.dispose();
    },
  );

  test('FileDownloads: unduh, baca lokal, hapus, bersihkan', () async {
    final dir = await Directory.systemTemp.createTemp('ja-dl');
    addTearDown(() => dir.delete(recursive: true));
    final d = FileDownloads(
      baseDir: () async => dir,
      client: MockClient((req) async => http.Response.bytes([1, 2, 3], 200)),
    );
    expect(await d.local('mat/a/1.pdf'), isNull);
    final path = await d.download('mat/a/1.pdf', Uri.parse('https://x.test/f'));
    expect(path, endsWith('mat_a_1.pdf'));
    expect(await File(path).readAsBytes(), [1, 2, 3]);
    expect(await d.local('mat/a/1.pdf'), path);
    await d.delete('mat/a/1.pdf');
    expect(await d.local('mat/a/1.pdf'), isNull);

    final failing = FileDownloads(
      baseDir: () async => dir,
      client: MockClient((req) async => http.Response('no', 403)),
    );
    await expectLater(
      failing.download('mat/a/2.pdf', Uri.parse('https://x.test/f')),
      throwsA(isA<HttpException>()),
    );
    expect(
      await failing.local('mat/a/2.pdf'),
      isNull,
      reason: 'gagal = tidak ada file setengah jadi',
    );
  });
}
