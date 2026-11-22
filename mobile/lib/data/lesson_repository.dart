import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/offline.dart';
import '../core/providers.dart';
import 'engagement_repository.dart';

class LessonMaterial {
  const LessonMaterial({
    required this.title,
    required this.path,
    required this.size,
  });

  final String title;
  final String path;
  final int size;
}

/// Isi pelajaran dari RPC `lesson_content`. Database yang memutuskan hak akses:
/// tanpa hak, hanya `access: false` yang dikirim (video & catatan tidak ikut).
class LessonContent {
  const LessonContent({
    required this.access,
    this.youtubeId = '',
    this.notes,
    this.materials = const [],
  });

  factory LessonContent.fromJson(Map<String, dynamic> j) {
    if (j['access'] != true) return const LessonContent(access: false);
    return LessonContent(
      access: true,
      youtubeId: j['youtube_id'] as String? ?? '',
      notes: j['notes'],
      materials: [
        for (final m in (j['materials'] as List? ?? const []))
          LessonMaterial(
            title: (m as Map)['title'] as String? ?? '',
            path: m['path'] as String? ?? '',
            size: (m['size'] as num?)?.toInt() ?? 0,
          ),
      ],
    );
  }

  final bool access;
  final String youtubeId;
  final Object? notes;
  final List<LessonMaterial> materials;
}

class LessonRepository {
  LessonRepository(this._client, [this._cache]);

  final SupabaseClient _client;
  final OfflineCache? _cache;

  /// null = pelajaran tidak ada / kelas tidak terlihat. Catatan & daftar materi
  /// disimpan di perangkat agar bisa dibaca offline (video tetap butuh internet).
  Future<LessonContent?> content(String slug, String lessonId) async {
    Future<Object?> fetch() => _client.rpc(
      'lesson_content',
      params: {'p_slug': slug, 'p_lesson': lessonId},
    );
    final cache = _cache;
    final data = cache == null
        ? await fetch()
        : await cache.read<Object?>('lesson.$slug.$lessonId', fetch);
    if (data == null) return null;
    return LessonContent.fromJson(Map<String, dynamic>.from(data as Map));
  }

  /// Tautan sementara (1 jam) untuk file di bucket privat `materials`.
  Future<String> materialUrl(String path) =>
      _client.storage.from('materials').createSignedUrl(path, 3600);
}

final lessonRepositoryProvider = Provider(
  (ref) => LessonRepository(
    ref.watch(supabaseProvider),
    ref.watch(offlineCacheProvider),
  ),
);

typedef LessonKey = ({String slug, String lessonId});

final lessonContentProvider = FutureProvider.family<LessonContent?, LessonKey>(
  (ref, k) => ref.watch(lessonRepositoryProvider).content(k.slug, k.lessonId),
);

// ---- progres belajar -------------------------------------------------------

/// Pelajaran selesai per kelas: slug → id pelajaran.
typedef ProgressMap = Map<String, Set<String>>;

abstract class ProgressRepository {
  Future<ProgressMap> load();
  Future<void> setDone(String slug, String lessonId, bool done);
}

/// Disimpan di tabel `lesson_progress` (RLS: hanya baris milik sendiri),
/// sama dengan website, jadi progres di web & aplikasi selalu sama.
class SupabaseProgressRepository implements ProgressRepository {
  SupabaseProgressRepository(this._client);

  final SupabaseClient _client;

  @override
  Future<ProgressMap> load() async {
    if (_client.auth.currentUser == null) return {};
    final rows = await _client
        .from('lesson_progress')
        .select('course_slug, lesson_id');
    final map = <String, Set<String>>{};
    for (final r in rows) {
      (map[r['course_slug'] as String] ??= {}).add(r['lesson_id'] as String);
    }
    return map;
  }

  @override
  Future<void> setDone(String slug, String lessonId, bool done) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) throw const AuthException('not signed in');
    final row = {'user_id': userId, 'course_slug': slug, 'lesson_id': lessonId};
    final table = _client.from('lesson_progress');
    if (done) {
      await table.upsert(
        row,
        onConflict: 'user_id,course_slug,lesson_id',
        ignoreDuplicates: true,
      );
    } else {
      await table.delete().match(row);
    }
  }
}

final progressRepositoryProvider = Provider<ProgressRepository>(
  (ref) => SupabaseProgressRepository(ref.watch(supabaseProvider)),
);

/// Progres belajar dengan dukungan offline:
/// - tanpa koneksi, perubahan disimpan di antrean perangkat dan tetap tampil;
/// - antrean dikirim saat progres dimuat ulang (aplikasi dibuka / login) atau
///   saat perubahan berikutnya berhasil terkirim;
/// - progres terakhir dari server disimpan untuk dibaca offline.
class ProgressNotifier extends AsyncNotifier<ProgressMap> {
  static const _queueKey = 'progress.queue';
  static const _cacheKey = 'cache.progress';

  SharedPreferences? get _prefs => ref.read(preferencesProvider);
  ProgressRepository get _repo => ref.read(progressRepositoryProvider);

  List<(String, String, bool)> _queue() => [
    for (final e in (jsonDecode(
      _prefs?.getString(_queueKey) ?? '[]',
    ) as List).cast<List>())
      (e[0] as String, e[1] as String, e[2] as bool),
  ];

  Future<void> _saveQueue(List<(String, String, bool)> q) async =>
      _prefs?.setString(
        _queueKey,
        jsonEncode([
          for (final (s, l, d) in q) [s, l, d],
        ]),
      );

  /// Kirim antrean berurutan; berhenti di galat jaringan (dicoba lagi nanti).
  Future<void> _flush() async {
    final q = _queue();
    while (q.isNotEmpty) {
      final (slug, lesson, done) = q.first;
      try {
        await _repo.setDone(slug, lesson, done);
      } catch (e) {
        if (isNetworkError(e)) break;
        // Ditolak server (mis. tidak berhak): buang agar tidak macet selamanya.
      }
      q.removeAt(0);
    }
    await _saveQueue(q);
  }

  ProgressMap _applyQueue(ProgressMap map) {
    var m = map;
    for (final (s, l, d) in _queue()) {
      m = _with(m, s, l, d);
    }
    return m;
  }

  @override
  Future<ProgressMap> build() async {
    ref.watch(currentUserProvider); // muat ulang saat login/keluar
    await _flush();
    try {
      final map = await ref.watch(progressRepositoryProvider).load();
      await _prefs?.setString(
        _cacheKey,
        jsonEncode({for (final e in map.entries) e.key: e.value.toList()}),
      );
      return _applyQueue(map);
    } catch (e) {
      final saved = _prefs?.getString(_cacheKey);
      if (!isNetworkError(e) || saved == null) rethrow;
      final raw = jsonDecode(saved) as Map<String, dynamic>;
      return _applyQueue({
        for (final e in raw.entries)
          e.key: {...(e.value as List).cast<String>()},
      });
    }
  }

  /// Ubah status selesai: langsung di layar, lalu ke server. Tanpa koneksi →
  /// masuk antrean (hasil true). Ditolak server → dikembalikan (hasil false).
  Future<bool> setDone(String slug, String lessonId, bool done) async {
    final before = state.value ?? {};
    state = AsyncData(_with(before, slug, lessonId, done));
    try {
      await _repo.setDone(slug, lessonId, done);
      ref.invalidate(achievementsProvider); // XP & lencana ikut berubah
      unawaited(_flush());
      return true;
    } catch (e) {
      if (isNetworkError(e)) {
        await _saveQueue([..._queue(), (slug, lessonId, done)]);
        return true;
      }
      state = AsyncData(before);
      return false;
    }
  }

  static ProgressMap _with(
    ProgressMap map,
    String slug,
    String lessonId,
    bool done,
  ) {
    final set = {...?map[slug]};
    done ? set.add(lessonId) : set.remove(lessonId);
    return {...map, slug: set};
  }
}

final progressProvider = AsyncNotifierProvider<ProgressNotifier, ProgressMap>(
  ProgressNotifier.new,
);
