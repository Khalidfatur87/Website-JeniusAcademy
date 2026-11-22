import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/providers.dart';

/// MODE SEKOLAH: gabung kelas dengan kode dari guru, lalu kerjakan tugasnya.
class MyClassroom {
  const MyClassroom({required this.id, required this.name});

  final String id;
  final String name;
}

enum AssignmentKind { lesson, quiz, course }

class Assignment {
  const Assignment({
    required this.id,
    required this.classroomName,
    required this.title,
    required this.instructions,
    required this.kind,
    required this.courseSlug,
    required this.courseTitle,
    required this.lessonId,
    required this.dueAt,
    required this.done,
    this.percent,
    this.doneCount,
    this.total,
  });

  factory Assignment.fromJson(Map<String, dynamic> j) {
    final status = Map<String, dynamic>.from((j['status'] as Map?) ?? const {});
    return Assignment(
      id: j['id'] as String,
      classroomName: j['classroom_name'] as String? ?? '',
      title: j['title'] as String? ?? '',
      instructions: j['instructions'] as String? ?? '',
      kind: AssignmentKind.values.firstWhere(
        (k) => k.name == j['kind'],
        orElse: () => AssignmentKind.course,
      ),
      courseSlug: j['course_slug'] as String,
      courseTitle: j['course_title'],
      lessonId: j['lesson_id'] as String?,
      dueAt: j['due_at'] == null ? null : DateTime.parse(j['due_at'] as String),
      done: status['done'] == true,
      percent: (status['percent'] as num?)?.toInt(),
      doneCount: (status['done_count'] as num?)?.toInt(),
      total: (status['total'] as num?)?.toInt(),
    );
  }

  final String id;
  final String classroomName;
  final String title;
  final String instructions;
  final AssignmentKind kind;
  final String courseSlug;
  final Object? courseTitle;
  final String? lessonId;
  final DateTime? dueAt;
  final bool done;

  /// Nilai kuis terbaik (tugas kuis).
  final int? percent;

  /// Pelajaran selesai / total (tugas kelas).
  final int? doneCount;
  final int? total;

  bool isOverdue(DateTime now) => !done && dueAt != null && now.isAfter(dueAt!);

  /// Halaman aplikasi untuk mengerjakan tugas ini.
  String get route => switch (kind) {
    AssignmentKind.lesson => '/courses/$courseSlug/$lessonId',
    AssignmentKind.quiz => '/courses/$courseSlug/quiz',
    AssignmentKind.course => '/courses/$courseSlug',
  };
}

enum JoinError { invalidCode, ownClass, generic }

class JoinException implements Exception {
  const JoinException(this.error);
  final JoinError error;
}

class ClassesRepository {
  ClassesRepository(this._client);

  final SupabaseClient _client;

  /// Mengembalikan nama kelas yang diikuti.
  Future<String> join(String code) async {
    try {
      final data = await _client.rpc(
        'join_classroom',
        params: {'p_code': code.trim().toUpperCase()},
      );
      return (data as Map)['name'] as String;
    } on PostgrestException catch (e) {
      throw JoinException(
        e.message.contains('invalid_code')
            ? JoinError.invalidCode
            : e.message.contains('own_class')
            ? JoinError.ownClass
            : JoinError.generic,
      );
    }
  }

  Future<List<MyClassroom>> myClassrooms() async {
    final uid = _client.auth.currentUser?.id;
    if (uid == null) return const [];
    final rows = await _client
        .from('classroom_members')
        .select('classroom_id, joined_at, classrooms(name)')
        .eq('student_id', uid)
        .order('joined_at', ascending: false);
    return [
      for (final r in rows)
        MyClassroom(
          id: r['classroom_id'] as String,
          name: (r['classrooms'] as Map?)?['name'] as String? ?? '-',
        ),
    ];
  }

  Future<void> leave(String classroomId) async {
    final uid = _client.auth.currentUser?.id;
    if (uid == null) return;
    await _client
        .from('classroom_members')
        .delete()
        .eq('classroom_id', classroomId)
        .eq('student_id', uid);
  }

  Future<List<Assignment>> myAssignments() async {
    final rows = await _client.rpc('my_assignments') as List;
    return [
      for (final r in rows)
        Assignment.fromJson(Map<String, dynamic>.from(r as Map)),
    ];
  }
}

final classesRepositoryProvider = Provider(
  (ref) => ClassesRepository(ref.watch(supabaseProvider)),
);

final myClassroomsProvider = FutureProvider((ref) {
  ref.watch(currentUserProvider);
  return ref.watch(classesRepositoryProvider).myClassrooms();
});

final myAssignmentsProvider = FutureProvider((ref) {
  ref.watch(currentUserProvider);
  return ref.watch(classesRepositoryProvider).myAssignments();
});
