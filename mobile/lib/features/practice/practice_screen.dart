import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/providers.dart';
import '../../data/practice_repository.dart';
import '../../domain/l10n_text.dart';
import '../../l10n/app_localizations.dart';
import '../../widgets/answer_option.dart';
import '../../widgets/async_view.dart';

/// Latihan pintar: ringkasan → sesi soal satu per satu → hasil sesi.
class PracticeScreen extends ConsumerStatefulWidget {
  const PracticeScreen({super.key});

  @override
  ConsumerState<PracticeScreen> createState() => _PracticeScreenState();
}

class _PracticeScreenState extends ConsumerState<PracticeScreen> {
  List<PracticeItem>? _session;
  int _index = 0;
  int? _choice;
  PracticeAnswer? _answer;
  int _correct = 0;
  int _mastered = 0;
  bool _busy = false;

  bool get _done => _session != null && _index >= _session!.length;

  Future<void> _start() async {
    setState(() => _busy = true);
    try {
      final items = await ref.read(practiceRepositoryProvider).queue();
      setState(() {
        _session = items;
        _index = 0;
        _choice = null;
        _answer = null;
        _correct = 0;
        _mastered = 0;
      });
    } catch (_) {
      if (mounted) _snack(AppLocalizations.of(context).errGeneric);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _check() async {
    final item = _session![_index];
    setState(() => _busy = true);
    try {
      final a = await ref.read(practiceRepositoryProvider).answer(item.id, _choice!);
      setState(() {
        _answer = a;
        if (a.correct) _correct++;
        if (a.mastered) _mastered++;
      });
      refreshAfterPractice(ref);
    } catch (_) {
      if (mounted) _snack(AppLocalizations.of(context).submitFailed);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _next() => setState(() {
        _index++;
        _choice = null;
        _answer = null;
      });

  void _snack(String text) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(text)));
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final session = _session;
    return Scaffold(
      appBar: AppBar(title: Text(t.practiceTitle)),
      body: session == null || _done ? _overview(context, t) : _question(context, t, session),
      bottomNavigationBar: session == null || _done
          ? null
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                child: FilledButton(
                  onPressed: _busy
                      ? null
                      : _answer != null
                          ? _next
                          : _choice == null
                              ? null
                              : _check,
                  child: Text(_answer != null ? t.next : t.practiceCheck),
                ),
              ),
            ),
    );
  }

  /// Ringkasan (sebelum mulai) atau hasil sesi (setelah selesai).
  Widget _overview(BuildContext context, AppLocalizations t) {
    final theme = Theme.of(context);
    final summary = ref.watch(practiceSummaryProvider);
    final locale = ref.watch(localeProvider).toString();
    return AsyncView(
      value: summary,
      onRetry: () => ref.invalidate(practiceSummaryProvider),
      builder: (s) => ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_done) ...[
            Card(
              margin: const EdgeInsets.only(bottom: 16),
              color: theme.colorScheme.primaryContainer,
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    const Icon(Icons.emoji_events_outlined, size: 40),
                    const SizedBox(height: 8),
                    Text(t.practiceDone, style: theme.textTheme.titleLarge),
                    Text(t.practiceScore(_correct, _session!.length)),
                    if (_mastered > 0) Text(t.practiceMasteredCount(_mastered)),
                  ],
                ),
              ),
            ),
          ],
          Text(t.practiceSubtitle, style: theme.textTheme.bodyLarge),
          const SizedBox(height: 16),
          Card(
            margin: EdgeInsets.zero,
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (s.due > 0) ...[
                    Text(t.practiceDue(s.due), style: theme.textTheme.titleLarge),
                    const SizedBox(height: 8),
                    Text(t.practiceIntro),
                    const SizedBox(height: 16),
                    FilledButton.icon(
                      onPressed: _busy ? null : _start,
                      icon: const Icon(Icons.play_arrow),
                      label: Text(_done ? t.practiceAgain : t.practiceStart),
                    ),
                  ] else ...[
                    const Icon(Icons.check_circle_outline, size: 40),
                    const SizedBox(height: 8),
                    Text(t.practiceNothingDue,
                        style: theme.textTheme.titleMedium, textAlign: TextAlign.center),
                    const SizedBox(height: 4),
                    if (s.tracked == 0)
                      Text(t.practiceNothingTracked, textAlign: TextAlign.center)
                    else if (s.nextDue case final next?)
                      Text(
                        t.practiceNextDue(DateFormat.yMMMMd(locale).add_Hm().format(next.toLocal())),
                        textAlign: TextAlign.center,
                      ),
                    if (s.tracked == 0) ...[
                      const SizedBox(height: 16),
                      OutlinedButton(
                        onPressed: () => context.go('/courses'),
                        child: Text(t.practiceBrowse),
                      ),
                    ],
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _question(BuildContext context, AppLocalizations t, List<PracticeItem> session) {
    final theme = Theme.of(context);
    final locale = ref.watch(localeProvider).languageCode;
    final item = session[_index];
    final a = _answer;
    final explanation = a == null ? '' : pickText(a.explanation, locale).trim();
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(t.practiceProgress(_index + 1, session.length), style: theme.textTheme.labelLarge),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: LinearProgressIndicator(value: (_index + (a == null ? 0 : 1)) / session.length),
        ),
        const SizedBox(height: 16),
        Text(pickText(item.courseTitle, locale), style: theme.textTheme.bodySmall),
        const SizedBox(height: 4),
        Text(pickText(item.prompt, locale), style: theme.textTheme.titleMedium),
        const SizedBox(height: 12),
        for (final (i, option) in item.options.indexed)
          AnswerOption(
            text: pickText(option, locale),
            selected: _choice == i,
            state: a == null
                ? null
                : i == a.answer
                    ? true
                    : _choice == i
                        ? false
                        : null,
            onTap: a == null && !_busy ? () => setState(() => _choice = i) : null,
          ),
        if (a != null) ...[
          const SizedBox(height: 8),
          Text(
            a.mastered ? t.practiceMastered : (a.correct ? t.practiceCorrect : t.practiceWrong),
            style: theme.textTheme.titleMedium?.copyWith(
              color: a.correct ? Colors.green.shade700 : theme.colorScheme.error,
            ),
          ),
          if (explanation.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(t.explanation, style: theme.textTheme.labelLarge),
            const SizedBox(height: 4),
            Text(explanation),
          ],
        ],
      ],
    );
  }
}
