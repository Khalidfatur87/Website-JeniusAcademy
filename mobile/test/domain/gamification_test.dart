import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:jeniusacademy/domain/gamification.dart';

/// Kasus uji yang sama dengan website (src/lib/gamification.test.ts).
void main() {
  final shared = jsonDecode(
    File('../shared/fixtures/gamification.json').readAsStringSync(),
  ) as Map<String, dynamic>;

  test('xpForLevel', () {
    for (final c in shared['xpForLevel'] as List) {
      expect(xpForLevel(c['level'] as int), c['xp'], reason: 'level ${c['level']}');
    }
  });

  test('levelFromXp', () {
    for (final c in shared['levelFromXp'] as List) {
      final got = levelFromXp(c['xp'] as int);
      final e = c['expected'] as Map;
      expect(
        [got.level, got.current, got.needed, got.percent],
        [e['level'], e['current'], e['needed'], e['percent']],
        reason: 'xp ${c['xp']}',
      );
    }
  });

  test('bestStreak', () {
    for (final c in shared['bestStreak'] as List) {
      expect(bestStreak((c['days'] as List).cast<String>()), c['expected'], reason: '${c['days']}');
    }
  });

  test('badges', () {
    for (final c in shared['badges'] as List) {
      final s = c['stats'] as Map<String, dynamic>;
      final stats = AchievementStats(
        lessons: s['lessons'] as int? ?? 0,
        perfectQuizzes: s['perfectQuizzes'] as int? ?? 0,
        certificates: s['certificates'] as int? ?? 0,
        tryouts: s['tryouts'] as int? ?? 0,
        practiceCorrect: s['practiceCorrect'] as int? ?? 0,
        activeDays: (s['activeDays'] as List? ?? const []).cast<String>(),
      );
      final earned = [
        for (final e in badges(stats).entries)
          if (e.value) e.key.name,
      ];
      expect(earned, c['expected'], reason: '$s');
    }
  });

  test('AchievementStats.fromJson membaca hasil RPC my_achievements', () {
    final s = AchievementStats.fromJson({
      'xp_total': 450,
      'xp_week': 30,
      'lessons': 3,
      'active_days': ['2026-11-01', '2026-11-02'],
    });
    expect(s.xpTotal, 450);
    expect(s.lessons, 3);
    expect(bestStreak(s.activeDays), 2);
  });
}
