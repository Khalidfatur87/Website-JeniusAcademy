import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/offline.dart';
import '../core/providers.dart';

class Level {
  const Level({required this.id, required this.name, required this.position});

  final String id;
  final Object? name;
  final int position;
}

class CourseSummary {
  const CourseSummary({
    required this.slug,
    required this.levelId,
    required this.title,
    required this.summary,
    required this.teacherName,
    required this.lessonCount,
  });

  factory CourseSummary.fromJson(Map<String, dynamic> j) {
    final lessons = j['lessons'] as List? ?? const [];
    return CourseSummary(
      slug: j['slug'] as String,
      levelId: j['level_id'] as String,
      title: j['title'],
      summary: j['summary'],
      teacherName: j['teacher_name'] as String? ?? '',
      lessonCount: lessons.isEmpty
          ? 0
          : (lessons.first['count'] as num).toInt(),
    );
  }

  final String slug;
  final String levelId;
  final Object? title;
  final Object? summary;
  final String teacherName;
  final int lessonCount;
}

class LessonSummary {
  const LessonSummary({
    required this.id,
    required this.title,
    required this.minutes,
    required this.freePreview,
  });

  factory LessonSummary.fromJson(Map<String, dynamic> j) => LessonSummary(
    id: j['id'] as String,
    title: j['title'],
    minutes: (j['minutes'] as num?)?.toInt() ?? 0,
    freePreview: j['free_preview'] as bool? ?? false,
  );

  final String id;
  final Object? title;
  final int minutes;
  final bool freePreview;
}

/// Membaca konten publik. RLS di database hanya mengembalikan kelas terbit;
/// video & catatan pelajaran tidak bisa dibaca langsung (lewat RPC lesson_content).
class CourseRepository {
  CourseRepository(this._client, [this._cache]);

  final SupabaseClient _client;
  final OfflineCache? _cache;

  /// Baris mentah dari server; disimpan untuk dibaca saat offline.
  Future<List<Map<String, dynamic>>> _rows(
    String key,
    Future<List<Map<String, dynamic>>> Function() fetch,
  ) async {
    final cache = _cache;
    if (cache == null) return fetch();
    final raw = await cache.read<List<dynamic>>(key, fetch);
    return [for (final r in raw) Map<String, dynamic>.from(r as Map)];
  }

  Future<List<Level>> levels() async {
    final rows = await _rows(
      'levels',
      () =>
          _client.from('levels').select('id, name, position').order('position'),
    );
    return [
      for (final r in rows)
        Level(
          id: r['id'] as String,
          name: r['name'],
          position: (r['position'] as num).toInt(),
        ),
    ];
  }

  /// Kelas terbit yang punya pelajaran (sama dengan katalog website).
  Future<List<CourseSummary>> courses() async {
    final rows = await _rows(
      'courses',
      () => _client
          .from('courses')
          .select(
            'slug, level_id, title, summary, teacher_name, lessons(count)',
          )
          .eq('published', true)
          .order('position'),
    );
    return [for (final r in rows) CourseSummary.fromJson(r)]
        .where((c) => c.lessonCount > 0)
        .toList();
  }

  Future<CourseSummary?> course(String slug) async {
    final rows = await _rows(
      'course.$slug',
      () => _client
          .from('courses')
          .select(
            'slug, level_id, title, summary, teacher_name, lessons(count)',
          )
          .eq('slug', slug),
    );
    return rows.isEmpty ? null : CourseSummary.fromJson(rows.first);
  }

  Future<List<LessonSummary>> lessons(String slug) async {
    final rows = await _rows(
      'lessons.$slug',
      () => _client
          .from('lessons')
          .select('id, title, minutes, free_preview')
          .eq('course_slug', slug)
          .order('position'),
    );
    return [for (final r in rows) LessonSummary.fromJson(r)];
  }
}

final courseRepositoryProvider = Provider(
  (ref) => CourseRepository(
    ref.watch(supabaseProvider),
    ref.watch(offlineCacheProvider),
  ),
);

final levelsProvider = FutureProvider(
  (ref) => ref.watch(courseRepositoryProvider).levels(),
);
final coursesProvider = FutureProvider(
  (ref) => ref.watch(courseRepositoryProvider).courses(),
);
final courseProvider = FutureProvider.family<CourseSummary?, String>(
  (ref, slug) => ref.watch(courseRepositoryProvider).course(slug),
);
final lessonsProvider = FutureProvider.family<List<LessonSummary>, String>(
  (ref, slug) => ref.watch(courseRepositoryProvider).lessons(slug),
);
