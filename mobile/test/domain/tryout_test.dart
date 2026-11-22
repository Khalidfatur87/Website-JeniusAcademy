import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:jeniusacademy/domain/tryout.dart';

/// Kasus uji yang sama dengan website (src/lib/tryout.test.ts).
void main() {
  final shared = jsonDecode(File('../shared/fixtures/tryout.json').readAsStringSync())
      as Map<String, dynamic>;
  final minutes = [for (final s in shared['sections'] as List) (s as Map)['minutes'] as int];
  final start = DateTime.parse(shared['start'] as String);
  DateTime? date(Object? v) => v == null ? null : DateTime.parse(v as String);

  test('currentSection', () {
    for (final c in shared['currentSection'] as List) {
      final at = start.add(Duration(
        milliseconds: ((c['atMinutes'] as num) * 60000 + (c['atSeconds'] as num) * 1000).round(),
      ));
      final r = currentSection(minutes, start, at, finishedThrough: c['finishedThrough'] as int);
      final e = c['expected'] as Map;
      expect([r.index, r.secondsLeft], [e['index'], e['secondsLeft']], reason: '$c');
    }
  });

  test('formatClock & totalMinutes', () {
    for (final c in shared['formatClock'] as List) {
      expect(formatClock(c['seconds'] as int), c['expected']);
    }
    expect(totalMinutes(minutes), shared['totalMinutes']);
  });

  test('tryoutWindow', () {
    final w = shared['tryoutWindow'] as Map;
    final now = DateTime.parse(w['now'] as String);
    for (final c in w['cases'] as List) {
      expect(tryoutWindow(date(c['opensAt']), date(c['closesAt']), now).name, c['expected'], reason: '$c');
    }
  });

  test('weakestSections', () {
    final w = shared['weakestSections'] as Map;
    final r = weakestSections([
      for (final s in w['scores'] as List)
        (id: s['id'] as String, score: s['score'] as int, total: s['total'] as int),
    ]);
    expect(r.map((x) => x.id).toList(), w['expectedIds']);
    expect(r.first.percent, w['expectedFirstPercent']);
  });
}
