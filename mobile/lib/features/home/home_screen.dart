import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import '../../data/engagement_repository.dart';
import '../../domain/gamification.dart';
import '../../l10n/app_localizations.dart';
import '../../widgets/async_view.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final name = ref.watch(myNameProvider).value;
    final stats = ref.watch(achievementsProvider);

    return Scaffold(
      appBar: AppBar(title: Text(t.hello(name?.split(' ').first ?? ''))),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(achievementsProvider.future),
        child: AsyncView(
          value: stats,
          onRetry: () => ref.invalidate(achievementsProvider),
          builder: (s) => ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _LevelCard(stats: s),
              const SizedBox(height: 12),
              // Tinggi ketiga kotak disamakan walau labelnya terbungkus dua baris.
              IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Expanded(child: _StatTile(label: t.xpWeek, value: '${s.xpWeek}')),
                    const SizedBox(width: 12),
                    Expanded(child: _StatTile(label: t.lessonsDone, value: '${s.lessons}')),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _StatTile(
                        label: t.bestStreak,
                        value: t.days(bestStreak(s.activeDays)),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              Text(t.quickLinks, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              const QuickLinks(),
              const SizedBox(height: 24),
              Text(t.badgesTitle, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              for (final b in badges(s).entries) _BadgeTile(id: b.key, earned: b.value),
            ],
          ),
        ),
      ),
    );
  }
}

class _LevelCard extends StatelessWidget {
  const _LevelCard({required this.stats});

  final AchievementStats stats;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final scheme = Theme.of(context).colorScheme;
    final lv = levelFromXp(stats.xpTotal);
    return Card(
      margin: EdgeInsets.zero,
      color: scheme.primaryContainer,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(t.levelLabel(lv.level), style: Theme.of(context).textTheme.headlineSmall),
                const Spacer(),
                Text('${stats.xpTotal} XP', style: Theme.of(context).textTheme.titleMedium),
              ],
            ),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(value: lv.percent / 100, minHeight: 10),
            ),
            const SizedBox(height: 8),
            Text(t.xpToNext(lv.current, lv.needed)),
          ],
        ),
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(value, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 4),
            Text(label, style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }
}

class _BadgeTile extends StatelessWidget {
  const _BadgeTile({required this.id, required this.earned});

  final BadgeId id;
  final bool earned;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final (name, how, icon) = switch (id) {
      BadgeId.firstLesson => (t.badgeFirstLesson, t.badgeFirstLessonHow, Icons.menu_book),
      BadgeId.tenLessons => (t.badgeTenLessons, t.badgeTenLessonsHow, Icons.menu_book),
      BadgeId.fiftyLessons => (t.badgeFiftyLessons, t.badgeFiftyLessonsHow, Icons.menu_book),
      BadgeId.perfectQuiz => (t.badgePerfectQuiz, t.badgePerfectQuizHow, Icons.auto_awesome),
      BadgeId.streak7 => (t.badgeStreak7, t.badgeStreak7How, Icons.local_fire_department),
      BadgeId.streak30 => (t.badgeStreak30, t.badgeStreak30How, Icons.local_fire_department),
      BadgeId.firstCertificate => (
          t.badgeFirstCertificate,
          t.badgeFirstCertificateHow,
          Icons.workspace_premium
        ),
      BadgeId.threeCertificates => (
          t.badgeThreeCertificates,
          t.badgeThreeCertificatesHow,
          Icons.workspace_premium
        ),
      BadgeId.tryoutTaker => (t.badgeTryoutTaker, t.badgeTryoutTakerHow, Icons.gps_fixed),
      BadgeId.practice50 => (t.badgePractice50, t.badgePractice50How, Icons.check_circle),
    };
    final scheme = Theme.of(context).colorScheme;
    return Opacity(
      opacity: earned ? 1 : 0.45,
      child: ListTile(
        contentPadding: EdgeInsets.zero,
        leading: CircleAvatar(
          backgroundColor: earned ? scheme.secondaryContainer : scheme.surfaceContainerHighest,
          child: Icon(icon, color: earned ? scheme.onSecondaryContainer : scheme.outline),
        ),
        title: Text(name),
        subtitle: Text(how),
        trailing: earned ? Icon(Icons.check, color: scheme.primary) : null,
      ),
    );
  }
}

/// Pintu masuk fitur di luar tab bawah (try-out, kelas live, kelas sekolah).
class QuickLinks extends StatelessWidget {
  const QuickLinks({super.key});

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final links = [
      (Icons.timer_outlined, t.tryoutTitle, '/tryouts'),
      (Icons.videocam_outlined, t.liveTitle, '/live'),
    ];
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final (icon, label, route) in links)
          ActionChip(
            avatar: Icon(icon, size: 18),
            label: Text(label),
            onPressed: () => context.push(route),
          ),
      ],
    );
  }
}
