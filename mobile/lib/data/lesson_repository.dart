import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/providers.dart';
import 'engagement_repository.dart';

class LessonMaterial {
  const LessonMaterial({required this.title, required this.path, required this.size});

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
  LessonRepository(this._client);

  final SupabaseClient _client;

  /// null = pelajaran tidak ada / kelas tidak terlihat.
  Future<LessonContent?> content(String slug, String lessonId) async {
    final data = await _client.rpc(
      'lesson_content',
      params: {'p_slug': slug, 'p_lesson': lessonId},
    );
    if (data == null) return null;
    return LessonContent.fromJson(Map<String, dynamic>.from(data as Map));
  }

  /// Tautan sementara (1 jam) untuk file di bucket privat `materials`.
  Future<String> materialUrl(String path) =>
      _client.storage.from('materials').createSignedUrl(path, 3600);
}

final lessonRepositoryProvider = Provider((ref) => LessonRepository(ref.watch(supabaseProvider)));

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
    final rows = await _client.from('lesson_progress').select('course_slug, lesson_id');
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
      await table.upsert(row, onConflict: 'user_id,course_slug,lesson_id', ignoreDuplicates: true);
    } else {
      await table.delete().match(row);
    }
  }
}

final progressRepositoryProvider = Provider<ProgressRepository>(
  (ref) => SupabaseProgressRepository(ref.watch(supabaseProvider)),
);

class ProgressNotifier extends AsyncNotifier<ProgressMap> {
  @override
  Future<ProgressMap> build() {
    ref.watch(currentUserProvider); // muat ulang saat login/keluar
    return ref.watch(progressRepositoryProvider).load();
  }

  /// Ubah status selesai: langsung di layar, lalu ke server.
  /// Jika server gagal, dikembalikan seperti semula dan hasilnya false.
  Future<bool> setDone(String slug, String lessonId, bool done) async {
    final before = state.value ?? {};
    state = AsyncData(_with(before, slug, lessonId, done));
    try {
      await ref.read(progressRepositoryProvider).setDone(slug, lessonId, done);
      ref.invalidate(achievementsProvider); // XP & lencana ikut berubah
      return true;
    } catch (_) {
      state = AsyncData(before);
      return false;
    }
  }

  static ProgressMap _with(ProgressMap map, String slug, String lessonId, bool done) {
    final set = {...?map[slug]};
    done ? set.add(lessonId) : set.remove(lessonId);
    return {...map, slug: set};
  }
}

final progressProvider = AsyncNotifierProvider<ProgressNotifier, ProgressMap>(ProgressNotifier.new);
