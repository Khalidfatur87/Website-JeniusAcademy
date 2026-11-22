import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:jeniusacademy/core/home_widget_sync.dart';
import 'package:jeniusacademy/domain/gamification.dart';
import 'package:jeniusacademy/l10n/app_localizations.dart';

void main() {
  final t = lookupAppLocalizations(const Locale('id'));
  final now = DateTime(2026, 11, 22, 19);

  test('isi widget: streak, level, XP minggu ini', () {
    final data = streakWidgetData(
      const AchievementStats(xpTotal: 450, xpWeek: 80, activeDays: ['2026-11-20', '2026-11-21', '2026-11-22']),
      now,
      t,
    );
    expect(data, {'title': 'Streak', 'streak': '3 hari', 'subtitle': 'Level 3 · 80 XP'});
  });

  test('keluar akun: widget dikosongkan', () {
    expect(streakWidgetData(null, now, t)['streak'], '0');
  });
}
