import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../../data/engagement_repository.dart';
import '../../l10n/app_localizations.dart';
import '../../widgets/async_view.dart';

class LeaderboardScreen extends ConsumerStatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  ConsumerState<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends ConsumerState<LeaderboardScreen> {
  LeaderboardPeriod _period = LeaderboardPeriod.week;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final rows = ref.watch(leaderboardProvider(_period));
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: Text(t.tabLeaderboard)),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: SegmentedButton<LeaderboardPeriod>(
              segments: [
                ButtonSegment(value: LeaderboardPeriod.week, label: Text(t.xpWeek)),
                ButtonSegment(value: LeaderboardPeriod.all, label: Text(t.allTime)),
              ],
              selected: {_period},
              onSelectionChanged: (s) => setState(() => _period = s.first),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => ref.refresh(leaderboardProvider(_period).future),
              child: AsyncView(
                value: rows,
                onRetry: () => ref.invalidate(leaderboardProvider(_period)),
                builder: (list) => ListView.builder(
                  itemCount: list.length,
                  itemBuilder: (_, i) {
                    final r = list[i];
                    return ListTile(
                      tileColor: r.isMe ? scheme.primaryContainer : null,
                      leading: CircleAvatar(child: Text('${r.rank}')),
                      title: Text(r.name),
                      trailing: Text('${r.xp} XP'),
                    );
                  },
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
