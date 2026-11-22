import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/providers.dart';
import 'lesson_repository.dart';

const commentMax = 2000;

/// Tulisan diskusi pelajaran. RLS: hanya yang berhak atas pelajaran itu yang
/// bisa membaca & menulis; balasan hanya satu tingkat.
class LessonComment {
  const LessonComment({
    required this.id,
    required this.parentId,
    required this.body,
    required this.createdAt,
    required this.authorName,
    required this.authorAvatar,
    required this.authorRole,
    required this.isMine,
    required this.canDelete,
  });

  final String id;
  final String? parentId;
  final String body;
  final DateTime createdAt;
  final String authorName;
  final String? authorAvatar;

  /// student / teacher / super_admin
  final String authorRole;
  final bool isMine;
  final bool canDelete;

  bool get isStaff => authorRole == 'teacher' || authorRole == 'super_admin';
}

/// Pertanyaan + balasannya, urut waktu (sama dengan `threads()` di website).
List<({LessonComment question, List<LessonComment> replies})> threads(
  List<LessonComment> list,
) {
  final replies = <String, List<LessonComment>>{};
  for (final c in list) {
    if (c.parentId != null) (replies[c.parentId!] ??= []).add(c);
  }
  return [
    for (final q in list)
      if (q.parentId == null) (question: q, replies: replies[q.id] ?? const []),
  ];
}

class DiscussionRepository {
  DiscussionRepository(this._client);

  final SupabaseClient _client;

  Future<List<LessonComment>> list(String slug, String lessonId) async {
    final rows = await _client.rpc(
      'lesson_comments_list',
      params: {'p_slug': slug, 'p_lesson': lessonId},
    ) as List;
    return [
      for (final r in rows.cast<Map>())
        LessonComment(
          id: r['id'] as String,
          parentId: r['parent_id'] as String?,
          body: r['body'] as String,
          createdAt: DateTime.parse(r['created_at'] as String),
          authorName: r['author_name'] as String? ?? '-',
          authorAvatar: r['author_avatar'] == null
              ? null
              : _client.storage
                    .from('avatars')
                    .getPublicUrl(r['author_avatar'] as String),
          authorRole: r['author_role'] as String? ?? 'student',
          isMine: r['is_mine'] as bool? ?? false,
          canDelete: r['can_delete'] as bool? ?? false,
        ),
    ];
  }

  /// false = teks kosong/terlalu panjang (tidak dikirim).
  Future<bool> post(
    String slug,
    String lessonId,
    String body, {
    String? parentId,
  }) async {
    final text = body.trim();
    if (text.isEmpty || text.length > commentMax) return false;
    final uid = _client.auth.currentUser?.id;
    if (uid == null) throw const AuthException('not signed in');
    await _client.from('lesson_comments').insert({
      'course_slug': slug,
      'lesson_id': lessonId,
      'user_id': uid,
      'parent_id': parentId,
      'body': text,
    });
    return true;
  }

  Future<void> delete(String id) =>
      _client.from('lesson_comments').delete().eq('id', id);
}

final discussionRepositoryProvider = Provider(
  (ref) => DiscussionRepository(ref.watch(supabaseProvider)),
);

final commentsProvider = FutureProvider.family<List<LessonComment>, LessonKey>(
  (ref, k) => ref.watch(discussionRepositoryProvider).list(k.slug, k.lessonId),
);
