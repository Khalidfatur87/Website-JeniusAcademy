import 'package:flutter_test/flutter_test.dart';
import 'package:jeniusacademy/data/discussion_repository.dart';

LessonComment _c(String id, {String? parent, String role = 'student'}) =>
    LessonComment(
      id: id,
      parentId: parent,
      body: id,
      createdAt: DateTime(2026),
      authorName: 'A',
      authorAvatar: null,
      authorRole: role,
      isMine: false,
      canDelete: false,
    );

void main() {
  test('threads: pertanyaan dengan balasannya, urut seperti diterima', () {
    final t = threads([
      _c('q1'),
      _c('r1', parent: 'q1'),
      _c('q2'),
      _c('r2', parent: 'q1', role: 'teacher'),
    ]);
    expect(t.map((x) => x.question.id), ['q1', 'q2']);
    expect(t.first.replies.map((r) => r.id), ['r1', 'r2']);
    expect(t.first.replies.last.isStaff, isTrue);
    expect(t.last.replies, isEmpty);
  });
}
