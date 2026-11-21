import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:jeniusacademy/domain/quiz.dart';

/// Kasus uji yang sama dengan website (src/lib/quiz.test.ts).
void main() {
  final shared = jsonDecode(File('../shared/fixtures/quiz.json').readAsStringSync())
      as Map<String, dynamic>;

  Attempt attempt(Map a) => Attempt(
        courseSlug: a['courseSlug'] as String,
        score: a['score'] as int,
        total: a['total'] as int,
        at: a['at'] as String,
      );

  test('attemptPercent', () {
    for (final c in shared['attemptPercent'] as List) {
      expect(attemptPercent(c['score'] as int, c['total'] as int), c['expected'], reason: '$c');
    }
  });

  test('bestAttempt', () {
    for (final c in shared['bestAttempt'] as List) {
      final list = [for (final a in c['attempts'] as List) attempt(a as Map)];
      final got = bestAttempt(list, c['slug'] as String);
      final i = c['expectedIndex'] as int?;
      expect(got, i == null ? isNull : same(list[i]), reason: '$c');
    }
  });

  test('certificateStatus', () {
    for (final c in shared['certificateStatus'] as List) {
      final input = c['input'] as Map;
      final best = input['best'] as Map?;
      final got = certificateStatus(
        doneLessons: input['doneLessons'] as int,
        totalLessons: input['totalLessons'] as int,
        quizCount: input['quizCount'] as int,
        best: best == null ? null : (score: best['score'] as int, total: best['total'] as int),
        minPercent: input['minPercent'] as int,
      );
      expect(got.name, c['expected'], reason: '$input');
    }
  });

  test('quizVerdict', () {
    expect(quizVerdict(100), QuizVerdict.great);
    expect(quizVerdict(70), QuizVerdict.good);
    expect(quizVerdict(69), QuizVerdict.needsReview);
  });
}
