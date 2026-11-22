import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/providers.dart';

/// MODE ORANG TUA. Siswa membuat kode (7 hari); orang tua menautkan diri lalu
/// melihat RINGKASAN belajar (bukan jawaban/pesan) lewat RPC parent_children.
class ChildCourse {
  const ChildCourse({
    required this.title,
    required this.done,
    required this.total,
  });

  final Object? title;
  final int done;
  final int total;
}

class ChildSummary {
  const ChildSummary({
    required this.studentId,
    required this.name,
    required this.lessonsTotal,
    required this.lessonsWeek,
    required this.quizzesWeek,
    required this.avgQuizPercent,
    required this.lastActive,
    required this.activeDays,
    required this.courses,
  });

  factory ChildSummary.fromJson(Map<String, dynamic> j) => ChildSummary(
    studentId: j['student_id'] as String,
    name: j['name'] as String? ?? '-',
    lessonsTotal: (j['lessons_total'] as num?)?.toInt() ?? 0,
    lessonsWeek: (j['lessons_week'] as num?)?.toInt() ?? 0,
    quizzesWeek: (j['quizzes_week'] as num?)?.toInt() ?? 0,
    avgQuizPercent: (j['avg_quiz_percent'] as num?)?.toInt(),
    lastActive: j['last_active'] == null
        ? null
        : DateTime.parse(j['last_active'] as String),
    activeDays: [
      for (final d in (j['active_days'] as List? ?? const []))
        DateTime.parse('$d'),
    ],
    courses: [
      for (final c in (j['courses'] as List? ?? const []))
        ChildCourse(
          title: (c as Map)['title'],
          done: (c['done'] as num).toInt(),
          total: (c['total'] as num).toInt(),
        ),
    ],
  );

  final String studentId;
  final String name;
  final int lessonsTotal;
  final int lessonsWeek;
  final int quizzesWeek;
  final int? avgQuizPercent;
  final DateTime? lastActive;

  /// Tanggal aktif (WIB), 60 hari terakhir.
  final List<DateTime> activeDays;
  final List<ChildCourse> courses;
}

class LinkedParent {
  const LinkedParent({required this.parentId, required this.name});

  final String parentId;
  final String name;
}

enum ParentLinkError { invalidCode, ownCode, generic }

class ParentLinkException implements Exception {
  const ParentLinkException(this.error);
  final ParentLinkError error;
}

class ParentRepository {
  ParentRepository(this._client);

  final SupabaseClient _client;

  String? get _uid => _client.auth.currentUser?.id;

  /// Kode baru untuk orang tua (menggantikan kode lama), berlaku 7 hari.
  Future<({String code, DateTime expiresAt})> createCode() async {
    final data = Map<String, dynamic>.from(
      await _client.rpc('create_parent_code') as Map,
    );
    return (
      code: data['code'] as String,
      expiresAt: DateTime.parse(data['expires_at'] as String),
    );
  }

  /// Orang tua menautkan diri; hasilnya nama anak.
  Future<String> redeem(String code) async {
    try {
      return await _client.rpc(
        'redeem_parent_code',
        params: {'p_code': code.trim().toUpperCase()},
      ) as String;
    } on PostgrestException catch (e) {
      throw ParentLinkException(
        e.message.contains('invalid_code')
            ? ParentLinkError.invalidCode
            : e.message.contains('own_code')
            ? ParentLinkError.ownCode
            : ParentLinkError.generic,
      );
    }
  }

  Future<List<ChildSummary>> children() async {
    if (_uid == null) return const [];
    final rows = await _client.rpc('parent_children') as List;
    return [
      for (final r in rows)
        ChildSummary.fromJson(Map<String, dynamic>.from(r as Map)),
    ];
  }

  Future<List<LinkedParent>> myParents() async {
    if (_uid == null) return const [];
    final rows = await _client.rpc('my_parents') as List;
    return [
      for (final r in rows.cast<Map>())
        LinkedParent(
          parentId: r['parent_id'] as String,
          name: r['name'] as String? ?? '-',
        ),
    ];
  }

  /// Orang tua berhenti memantau anak.
  Future<void> unlinkChild(String studentId) => _client
      .from('parent_links')
      .delete()
      .eq('parent_id', _uid ?? '')
      .eq('student_id', studentId);

  /// Siswa melepas orang tua yang memantaunya.
  Future<void> unlinkParent(String parentId) => _client
      .from('parent_links')
      .delete()
      .eq('parent_id', parentId)
      .eq('student_id', _uid ?? '');
}

final parentRepositoryProvider = Provider(
  (ref) => ParentRepository(ref.watch(supabaseProvider)),
);

final childrenProvider = FutureProvider((ref) {
  ref.watch(currentUserProvider);
  return ref.watch(parentRepositoryProvider).children();
});

final myParentsProvider = FutureProvider((ref) {
  ref.watch(currentUserProvider);
  return ref.watch(parentRepositoryProvider).myParents();
});
