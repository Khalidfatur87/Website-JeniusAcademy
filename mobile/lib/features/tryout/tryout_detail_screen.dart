import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/providers.dart';
import '../../data/tryout_repository.dart';
import '../../domain/l10n_text.dart';
import '../../domain/quiz.dart';
import '../../domain/tryout.dart';
import '../../l10n/app_localizations.dart';
import '../../widgets/async_view.dart';
import 'tryouts_screen.dart';

/// Detail try-out: subtes & aturan → tombol mulai/lanjutkan,
/// atau hasil + pembahasan + peringkat bila sudah diserahkan.
class TryoutDetailScreen extends ConsumerWidget {
  const TryoutDetailScreen({super.key, required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final locale = ref.watch(localeProvider).languageCode;
    final theme = Theme.of(context);
    final now = ref.watch(clockProvider)();

    return Scaffold(
      appBar: AppBar(title: Text(t.tryoutTitle)),
      body: AsyncView(
        value: ref.watch(tryoutsProvider),
        onRetry: () => ref.invalidate(tryoutsProvider),
        builder: (list) {
          final x = list.where((x) => x.slug == slug).firstOrNull;
          if (x == null) return ErrorRetry(onRetry: () => ref.invalidate(tryoutsProvider));
          final attempt = ref.watch(tryoutAttemptsProvider).value?[slug];
          final window = tryoutWindow(x.opensAt, x.closesAt, now);
          final date = DateFormat.yMMMMd(locale).add_Hm();

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              WindowChip(window: window),
              const SizedBox(height: 8),
              Text(pickText(x.title, locale), style: theme.textTheme.headlineSmall),
              const SizedBox(height: 8),
              if (pickText(x.description, locale).isNotEmpty) Text(pickText(x.description, locale)),
              if (x.opensAt != null) Text(t.tryoutOpensAt(date.format(x.opensAt!.toLocal()))),
              if (x.closesAt != null) Text(t.tryoutClosesAt(date.format(x.closesAt!.toLocal()))),
              const SizedBox(height: 16),
              if (attempt?.submitted == true)
                _ResultView(slug: slug, info: x)
              else ...[
                Text(t.tryoutSections, style: theme.textTheme.titleMedium),
                for (final (i, s) in x.sections.indexed)
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: CircleAvatar(child: Text('${i + 1}')),
                    title: Text(pickText(s.title, locale)),
                    trailing: Text(t.minutes(s.minutes)),
                  ),
                const SizedBox(height: 8),
                for (final rule in [t.tryoutRule1, t.tryoutRule2, t.tryoutRule3])
                  Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('•  '),
                        Expanded(child: Text(rule)),
                      ],
                    ),
                  ),
                const SizedBox(height: 16),
                if (attempt == null) Text(t.tryoutOneAttempt, style: theme.textTheme.bodySmall),
                const SizedBox(height: 8),
                FilledButton.icon(
                  onPressed: attempt != null || window == TryoutWindow.open
                      ? () => context.push('/tryouts/$slug/take')
                      : null,
                  icon: const Icon(Icons.timer_outlined),
                  label: Text(attempt != null ? t.tryoutContinue : t.tryoutStart),
                ),
              ],
              const SizedBox(height: 24),
              _Leaderboard(slug: slug),
            ],
          );
        },
      ),
    );
  }
}

class _ResultView extends ConsumerWidget {
  const _ResultView({required this.slug, required this.info});

  final String slug;
  final TryoutInfo info;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final locale = ref.watch(localeProvider).languageCode;
    final theme = Theme.of(context);
    String sectionTitle(String id) =>
        pickText(info.sections.where((s) => s.id == id).firstOrNull?.title, locale);

    return AsyncView(
      value: ref.watch(tryoutResultProvider(slug)),
      onRetry: () => ref.invalidate(tryoutResultProvider(slug)),
      builder: (r) {
        if (r == null) return const SizedBox.shrink();
        final weak = weakestSections(r.sectionScores).where((s) => s.percent < certificateMinPercent);
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Card(
              margin: EdgeInsets.zero,
              color: theme.colorScheme.primaryContainer,
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    Text(t.tryoutYourResult, style: theme.textTheme.titleMedium),
                    Text('${r.score}/${r.total}', style: theme.textTheme.displaySmall),
                    Text('${attemptPercent(r.score, r.total)}% · ${t.tryoutRank(r.rank, r.participants)}'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(t.tryoutPerSection, style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            for (final s in r.sectionScores) ...[
              Row(
                children: [
                  Expanded(child: Text(sectionTitle(s.id))),
                  Text('${s.score}/${s.total}'),
                ],
              ),
              const SizedBox(height: 4),
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: LinearProgressIndicator(
                  value: s.total == 0 ? 0 : s.score / s.total,
                  minHeight: 8,
                ),
              ),
              if (r.sectionAvg[s.id] case final avg?)
                Text(t.tryoutAverage(avg), style: theme.textTheme.bodySmall),
              const SizedBox(height: 10),
            ],
            const SizedBox(height: 8),
            Text(t.tryoutFocus, style: theme.textTheme.titleMedium),
            const SizedBox(height: 4),
            Text(weak.isEmpty ? t.tryoutAllGood : weak.map((s) => sectionTitle(s.id)).join(', ')),
            const SizedBox(height: 16),
            ExpansionTile(
              tilePadding: EdgeInsets.zero,
              title: Text(t.tryoutReview, style: theme.textTheme.titleMedium),
              children: [
                for (final (i, k) in r.key.indexed)
                  _ReviewItem(number: i + 1, item: k, chosen: r.answers[k.id], locale: locale),
              ],
            ),
          ],
        );
      },
    );
  }
}

class _ReviewItem extends StatelessWidget {
  const _ReviewItem({required this.number, required this.item, required this.chosen, required this.locale});

  final int number;
  final TryoutKeyItem item;
  final int? chosen;
  final String locale;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final theme = Theme.of(context);
    final ok = chosen == item.answer;
    final explanation = pickText(item.explanation, locale).trim();
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('$number. ${pickText(item.prompt, locale)}', style: theme.textTheme.bodyLarge),
          const SizedBox(height: 4),
          Text(
            chosen == null
                ? t.tryoutUnanswered
                : '${ok ? t.correct : t.wrong}: ${pickText(item.options[chosen!], locale)}',
            style: TextStyle(color: ok ? Colors.green.shade700 : theme.colorScheme.error),
          ),
          if (!ok) Text('✓ ${pickText(item.options[item.answer], locale)}'),
          if (explanation.isNotEmpty) Text(explanation, style: theme.textTheme.bodySmall),
        ],
      ),
    );
  }
}

class _Leaderboard extends ConsumerWidget {
  const _Leaderboard({required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final scheme = Theme.of(context).colorScheme;
    final rows = ref.watch(tryoutLeaderboardProvider(slug)).value ?? const [];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(t.tryoutLeaderboard, style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        if (rows.isEmpty) Text(t.tryoutLeaderboardEmpty),
        for (final r in rows.take(20))
          ListTile(
            dense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 8),
            tileColor: r.isMe ? scheme.primaryContainer : null,
            leading: CircleAvatar(radius: 14, child: Text('${r.rank}', style: const TextStyle(fontSize: 12))),
            title: Text('${r.name ?? t.tryoutHiddenName}${r.isMe ? ' (${t.tryoutYou})' : ''}'),
            trailing: Text('${r.score}/${r.total}'),
          ),
      ],
    );
  }
}
