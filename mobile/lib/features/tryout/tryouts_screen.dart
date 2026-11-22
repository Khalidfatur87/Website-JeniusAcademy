import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/providers.dart';
import '../../data/tryout_repository.dart';
import '../../domain/l10n_text.dart';
import '../../domain/tryout.dart';
import '../../l10n/app_localizations.dart';
import '../../widgets/async_view.dart';

/// Katalog try-out: jadwal, jumlah subtes & waktu, status percobaan sendiri.
class TryoutsScreen extends ConsumerWidget {
  const TryoutsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final locale = ref.watch(localeProvider).languageCode;
    final attempts = ref.watch(tryoutAttemptsProvider).value ?? const {};
    final now = ref.watch(clockProvider)();

    return Scaffold(
      appBar: AppBar(title: Text(t.tryoutTitle)),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(tryoutsProvider.future),
        child: AsyncView(
          value: ref.watch(tryoutsProvider),
          onRetry: () => ref.invalidate(tryoutsProvider),
          builder: (list) => list.isEmpty
              ? Center(child: Text(t.tryoutEmpty))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Text(t.tryoutSubtitle),
                    const SizedBox(height: 16),
                    for (final x in list)
                      Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        clipBehavior: Clip.antiAlias,
                        child: InkWell(
                          onTap: () => context.push('/tryouts/${x.slug}'),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    WindowChip(window: tryoutWindow(x.opensAt, x.closesAt, now)),
                                    const Spacer(),
                                    if (attempts[x.slug] case final a?)
                                      Text(
                                        a.submitted ? '✓ ${t.tryoutDone}' : t.tryoutContinue,
                                        style: Theme.of(context).textTheme.labelLarge,
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(pickText(x.title, locale),
                                    style: Theme.of(context).textTheme.titleMedium),
                                const SizedBox(height: 4),
                                Text(
                                  '${t.tryoutSectionCount(x.sections.length)} · '
                                  '${t.tryoutTotalTime(totalMinutes(x.sections.map((s) => s.minutes)))}',
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
        ),
      ),
    );
  }
}

class WindowChip extends StatelessWidget {
  const WindowChip({super.key, required this.window});

  final TryoutWindow window;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final scheme = Theme.of(context).colorScheme;
    final (label, color) = switch (window) {
      TryoutWindow.open => (t.tryoutWindowOpen, Colors.green.shade700),
      TryoutWindow.upcoming => (t.tryoutWindowUpcoming, scheme.secondary),
      TryoutWindow.closed => (t.tryoutWindowClosed, scheme.outline),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 12)),
    );
  }
}
