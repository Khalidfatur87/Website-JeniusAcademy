import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:jeniusacademy/domain/live.dart';

/// Kasus uji yang sama dengan website (src/lib/live.test.ts).
void main() {
  final shared = jsonDecode(File('../shared/fixtures/live.json').readAsStringSync()) as Map<String, dynamic>;

  test('livePhase', () {
    final start = DateTime.parse(shared['startsAt'] as String);
    for (final c in shared['livePhase'] as List) {
      expect(
        livePhase(start, shared['minutes'] as int, DateTime.parse(c['now'] as String)).name,
        c['expected'],
        reason: '${c['now']}',
      );
    }
  });

  test('googleCalendarUrl', () {
    final u = googleCalendarUrl(
      title: 'Bedah Soal UTBK',
      details: 'Bersama Kak Raka',
      startsAt: DateTime.utc(2026, 11, 22, 12),
      minutes: 90,
    );
    expect(u.host, 'calendar.google.com');
    expect(u.queryParameters['dates'], '20261122T120000Z/20261122T133000Z');
    expect(u.queryParameters['text'], 'Bedah Soal UTBK');
  });
}
