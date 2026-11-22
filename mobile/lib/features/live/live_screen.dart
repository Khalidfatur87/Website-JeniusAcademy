import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:material_ui/material_ui.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/providers.dart';
import '../../data/live_repository.dart';
import '../../domain/l10n_text.dart';
import '../../domain/live.dart';
import '../../l10n/app_localizations.dart';
import '../../widgets/async_view.dart';
import '../lesson/lesson_screen.dart';

String _phaseLabel(AppLocalizations t, LivePhase p) => switch (p) {
  LivePhase.upcoming => t.livePhaseUpcoming,
  LivePhase.soon => t.livePhaseSoon,
  LivePhase.live => t.livePhaseLive,
  LivePhase.ended => t.livePhaseEnded,
};

/// Jadwal kelas live (mendatang) dan rekaman (sudah selesai).
class LiveScreen extends ConsumerWidget {
  const LiveScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final now = ref.watch(clockProvider)();
    return Scaffold(
      appBar: AppBar(title: Text(t.liveTitle)),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(liveSessionsProvider.future),
        child: AsyncView(
          value: ref.watch(liveSessionsProvider),
          onRetry: () => ref.invalidate(liveSessionsProvider),
          builder: (list) {
            final upcoming = list
                .where(
                  (s) =>
                      livePhase(s.startsAt, s.minutes, now) != LivePhase.ended,
                )
                .toList();
            final past = list
                .where(
                  (s) =>
                      livePhase(s.startsAt, s.minutes, now) == LivePhase.ended,
                )
                .toList()
                .reversed;
            final theme = Theme.of(context);
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(t.liveSubtitle),
                const SizedBox(height: 16),
                Text(t.liveUpcoming, style: theme.textTheme.titleMedium),
                const SizedBox(height: 8),
                if (upcoming.isEmpty) Text(t.liveNoUpcoming),
                for (final s in upcoming) _LiveCard(session: s, now: now),
                if (past.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Text(t.livePast, style: theme.textTheme.titleMedium),
                  const SizedBox(height: 8),
                  for (final s in past) _LiveCard(session: s, now: now),
                ],
              ],
            );
          },
        ),
      ),
    );
  }
}

class _LiveCard extends ConsumerWidget {
  const _LiveCard({required this.session, required this.now});

  final LiveSession session;
  final DateTime now;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final locale = ref.watch(localeProvider);
    final phase = livePhase(session.startsAt, session.minutes, now);
    final when = DateFormat.yMMMEd(locale.toString())
        .add_Hm()
        .format(session.startsAt.toLocal());
    final scheme = Theme.of(context).colorScheme;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        onTap: () => context.push('/live/${session.id}'),
        leading: Icon(
          phase == LivePhase.ended
              ? Icons.play_circle_outline
              : Icons.videocam_outlined,
          color: phase == LivePhase.live ? scheme.error : scheme.primary,
        ),
        title: Text(pickText(session.title, locale.languageCode)),
        subtitle: Text(
          [
            when,
            t.minutes(session.minutes),
            if (session.hostName.isNotEmpty) t.liveHost(session.hostName),
          ].join(' · '),
        ),
        trailing: Text(
          _phaseLabel(t, phase),
          style: Theme.of(context).textTheme.labelSmall,
        ),
      ),
    );
  }
}

/// Detail kelas live: masuk (link dari server), tambah ke kalender, rekaman.
class LiveDetailScreen extends ConsumerWidget {
  const LiveDetailScreen({super.key, required this.id});

  final String id;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final locale = ref.watch(localeProvider);
    final theme = Theme.of(context);
    final now = ref.watch(clockProvider)();

    return Scaffold(
      appBar: AppBar(title: Text(t.liveTitle)),
      body: AsyncView(
        value: ref.watch(liveSessionsProvider),
        onRetry: () => ref.invalidate(liveSessionsProvider),
        builder: (list) {
          final s = list.where((x) => x.id == id).firstOrNull;
          if (s == null) {
            return ErrorRetry(onRetry: () => ref.invalidate(liveSessionsProvider));
          }
          final phase = livePhase(s.startsAt, s.minutes, now);
          final title = pickText(s.title, locale.languageCode);
          final description = pickText(s.description, locale.languageCode);
          final access = ref.watch(liveAccessProvider(id)).value;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(
                _phaseLabel(t, phase),
                style: theme.textTheme.labelLarge?.copyWith(
                  color: theme.colorScheme.primary,
                ),
              ),
              const SizedBox(height: 4),
              Text(title, style: theme.textTheme.headlineSmall),
              const SizedBox(height: 4),
              Text(
                [
                  DateFormat.yMMMMEEEEd(locale.toString())
                      .add_Hm()
                      .format(s.startsAt.toLocal()),
                  t.minutes(s.minutes),
                ].join(' · '),
              ),
              if (s.hostName.isNotEmpty) Text(t.liveHost(s.hostName)),
              if (description.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(description),
              ],
              const SizedBox(height: 20),
              if (access != null && !access.access)
                Text(
                  t.liveLocked,
                  style: TextStyle(color: theme.colorScheme.error),
                )
              else if (phase != LivePhase.ended) ...[
                if (access?.joinUrl case final url?)
                  FilledButton.icon(
                    onPressed: () => launchUrl(
                      Uri.parse(url),
                      mode: LaunchMode.externalApplication,
                    ),
                    icon: const Icon(Icons.videocam),
                    label: Text(t.liveJoin),
                  )
                else
                  Text(t.liveLinkLater),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: () => launchUrl(
                    googleCalendarUrl(
                      title: title,
                      details: description,
                      startsAt: s.startsAt,
                      minutes: s.minutes,
                    ),
                    mode: LaunchMode.externalApplication,
                  ),
                  icon: const Icon(Icons.event_outlined),
                  label: Text(t.liveAddToCalendar),
                ),
              ] else ...[
                Text(t.liveRecording, style: theme.textTheme.titleMedium),
                const SizedBox(height: 8),
                if (access?.recordingYoutubeId case final yt?)
                  ref.watch(videoViewProvider)(yt)
                else
                  Text(t.liveNoRecording),
              ],
            ],
          );
        },
      ),
    );
  }
}
