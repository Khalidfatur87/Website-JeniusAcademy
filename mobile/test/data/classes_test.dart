import 'package:flutter_test/flutter_test.dart';
import 'package:jeniusacademy/data/classes_repository.dart';

void main() {
  Assignment a(Map<String, dynamic> extra) => Assignment.fromJson({
    'id': 'x',
    'classroom_name': 'XII IPA 1',
    'title': 'Tugas',
    'instructions': '',
    'course_slug': 'mat',
    'course_title': {'id': 'Matematika'},
    'lesson_id': null,
    'due_at': null,
    ...extra,
  });

  test('status & rute tugas dari my_assignments', () {
    final lesson = a({
      'kind': 'lesson',
      'lesson_id': 'l1',
      'status': {'done': false},
    });
    expect(lesson.route, '/courses/mat/l1');
    final quiz = a({
      'kind': 'quiz',
      'status': {'done': true, 'percent': 80},
    });
    expect(
      [quiz.route, quiz.done, quiz.percent],
      ['/courses/mat/quiz', true, 80],
    );
    final course = a({
      'kind': 'course',
      'status': {'done': false, 'done_count': 3, 'total': 7},
    });
    expect(
      [course.route, course.doneCount, course.total],
      ['/courses/mat', 3, 7],
    );
  });

  test('lewat tenggat hanya bila belum selesai', () {
    final due = {'due_at': '2026-11-20T10:00:00Z'};
    final now = DateTime.utc(2026, 11, 22);
    expect(
      a({
        'kind': 'quiz',
        'status': {'done': false},
        ...due,
      }).isOverdue(now),
      isTrue,
    );
    expect(
      a({
        'kind': 'quiz',
        'status': {'done': true},
        ...due,
      }).isOverdue(now),
      isFalse,
    );
    expect(
      a({
        'kind': 'quiz',
        'status': {'done': false},
      }).isOverdue(now),
      isFalse,
    );
  });
}
