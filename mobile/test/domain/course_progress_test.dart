import 'package:flutter_test/flutter_test.dart';
import 'package:jeniusacademy/domain/course_progress.dart';

void main() {
  test('coursePercent', () {
    expect(coursePercent(0, 0), 0);
    expect(coursePercent(1, 3), 33);
    expect(coursePercent(2, 3), 67);
    expect(coursePercent(5, 3), 100);
  });

  test('lessonNeighbors', () {
    const ids = ['a', 'b', 'c'];
    expect(lessonNeighbors(ids, 'a'), (previous: null, next: 'b'));
    expect(lessonNeighbors(ids, 'b'), (previous: 'a', next: 'c'));
    expect(lessonNeighbors(ids, 'c'), (previous: 'b', next: null));
    expect(lessonNeighbors(ids, 'x'), (previous: null, next: null));
  });

  test('resumeLesson: pertama yang belum selesai, atau pelajaran pertama', () {
    const ids = ['a', 'b', 'c'];
    expect(resumeLesson(ids, {}), 'a');
    expect(resumeLesson(ids, {'a'}), 'b');
    expect(resumeLesson(ids, {'a', 'c'}), 'b');
    expect(resumeLesson(ids, {'a', 'b', 'c'}), 'a');
    expect(resumeLesson(const [], {}), null);
  });

  test('formatBytes', () {
    expect(formatBytes(820), '820 B');
    expect(formatBytes(12 * 1024), '12 KB');
    expect(formatBytes((3.4 * 1024 * 1024).round()), '3,4 MB');
  });
}
