import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:home_widget/home_widget.dart';

import '../domain/activity.dart';
import '../domain/gamification.dart';
import '../l10n/app_localizations.dart';

/// Isi widget layar utama (fungsi murni, dites).
Map<String, String> streakWidgetData(AchievementStats? stats, DateTime now, AppLocalizations t) {
  if (stats == null) return {'title': t.parentStreak, 'streak': '0', 'subtitle': t.appName};
  final streak = currentStreak(stats.activeDays.map(DateTime.parse), now);
  return {
    'title': t.parentStreak,
    'streak': t.days(streak),
    'subtitle': '${t.levelLabel(levelFromXp(stats.xpTotal).level)} · ${stats.xpWeek} XP',
  };
}

/// Menulis data ke widget Android (diganti di tes).
abstract class HomeWidgetWriter {
  Future<void> write(Map<String, String> data);
}

class _PluginWriter implements HomeWidgetWriter {
  @override
  Future<void> write(Map<String, String> data) async {
    try {
      for (final e in data.entries) {
        await HomeWidget.saveWidgetData<String>(e.key, e.value);
      }
      await HomeWidget.updateWidget(androidName: 'StreakWidgetProvider');
    } catch (e) {
      debugPrint('Widget tidak diperbarui: $e');
    }
  }
}

class _NoWriter implements HomeWidgetWriter {
  @override
  Future<void> write(Map<String, String> data) async {}
}

/// Hanya Android yang punya widget ini.
final homeWidgetWriterProvider = Provider<HomeWidgetWriter>(
  (ref) => !kIsWeb && defaultTargetPlatform == TargetPlatform.android ? _PluginWriter() : _NoWriter(),
);
