import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/providers.dart';
import '../../data/course_repository.dart';
import '../../data/quiz_repository.dart';
import '../../domain/l10n_text.dart';
import '../../domain/quiz.dart';
import '../../l10n/app_localizations.dart';
import '../../widgets/async_view.dart';

/// Kuis pilihan ganda. Kunci jawaban baru diterima dari server setelah
/// jawaban diserahkan, lalu benar/salah & pembahasan ditampilkan per soal.
class QuizScreen extends ConsumerStatefulWidget {
  const QuizScreen({super.key, required this.slug});

  final String slug;

  @override
  ConsumerState<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends ConsumerState<QuizScreen> {
  final _answers = <String, int>{};
  QuizResult? _result;
  bool _busy = false;
  final _scroll = ScrollController();

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _busy = true);
    try {
      final r = await submitQuiz(ref, widget.slug, Map.of(_answers));
      if (!mounted) return;
      setState(() => _result = r);
      _scroll.jumpTo(0);
    } on QuizException catch (e) {
      if (!mounted) return;
      final t = AppLocalizations.of(context);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(e.error == QuizError.noAccess ? t.quizNoAccess : t.submitFailed),
      ));
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(AppLocalizations.of(context).submitFailed)));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _retry() {
    setState(() {
      _answers.clear();
      _result = null;
    });
    _scroll.jumpTo(0);
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final locale = ref.watch(localeProvider).languageCode;
    final course = ref.watch(courseProvider(widget.slug)).value;
    final questions = ref.watch(quizQuestionsProvider(widget.slug));
    final result = _result;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          course == null ? t.quizTitle : '${t.quizTitle}: ${pickText(course.title, locale)}',
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ),
      body: AsyncView(
        value: questions,
        onRetry: () => ref.invalidate(quizQuestionsProvider(widget.slug)),
        builder: (list) => ListView(
          controller: _scroll,
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
          children: [
            if (result != null) _ScoreCard(result: result),
            for (final (i, q) in list.indexed)
              _QuestionCard(
                number: i + 1,
                question: q,
                locale: locale,
                selected: _answers[q.id],
                result: result?.results[q.id],
                onSelect: result == null ? (v) => setState(() => _answers[q.id] = v) : null,
              ),
          ],
        ),
      ),
      bottomNavigationBar: questions.value == null
          ? null
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                child: result == null
                    ? Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(t.quizProgress(_answers.length, questions.value!.length)),
                          const SizedBox(height: 8),
                          SizedBox(
                            width: double.infinity,
                            child: FilledButton(
                              onPressed: _busy || _answers.length < questions.value!.length
                                  ? null
                                  : _submit,
                              child: _busy
                                  ? const SizedBox.square(
                                      dimension: 20,
                                      child: CircularProgressIndicator(strokeWidth: 2),
                                    )
                                  : Text(t.checkAnswers),
                            ),
                          ),
                        ],
                      )
                    : Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () => context.pop(),
                              child: Text(t.backToCourse),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: FilledButton(onPressed: _retry, child: Text(t.retakeQuiz)),
                          ),
                        ],
                      ),
              ),
            ),
    );
  }
}

class _ScoreCard extends StatelessWidget {
  const _ScoreCard({required this.result});

  final QuizResult result;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final scheme = Theme.of(context).colorScheme;
    final percent = attemptPercent(result.score, result.total);
    final verdict = switch (quizVerdict(percent)) {
      QuizVerdict.great => t.verdictGreat,
      QuizVerdict.good => t.verdictGood,
      QuizVerdict.needsReview => t.verdictReview,
    };
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      color: scheme.primaryContainer,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Text(t.yourScore, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            Text('$percent%', style: Theme.of(context).textTheme.displaySmall),
            Text(t.scoreLine(result.score, result.total)),
            const SizedBox(height: 8),
            Text(verdict, textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

class _QuestionCard extends StatelessWidget {
  const _QuestionCard({
    required this.number,
    required this.question,
    required this.locale,
    required this.selected,
    required this.result,
    required this.onSelect,
  });

  final int number;
  final QuizQuestion question;
  final String locale;
  final int? selected;
  final QuestionResult? result;
  final ValueChanged<int>? onSelect;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final r = result;
    final good = Colors.green.shade700;
    final explanation = r == null ? '' : pickText(r.explanation, locale).trim();

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(t.questionNumber(number), style: theme.textTheme.labelLarge),
                const Spacer(),
                if (r != null)
                  Text(
                    selected == r.answer ? t.correct : t.wrong,
                    style: TextStyle(
                      color: selected == r.answer ? good : scheme.error,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(pickText(question.prompt, locale), style: theme.textTheme.titleMedium),
            const SizedBox(height: 12),
            for (final (i, option) in question.options.indexed)
              _Option(
                text: pickText(option, locale),
                selected: selected == i,
                state: r == null
                    ? null
                    : i == r.answer
                        ? true
                        : selected == i
                            ? false
                            : null,
                onTap: onSelect == null ? null : () => onSelect!(i),
              ),
            if (explanation.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(t.explanation, style: theme.textTheme.labelLarge),
              const SizedBox(height: 4),
              Text(explanation),
            ],
          ],
        ),
      ),
    );
  }
}

/// Satu pilihan jawaban. [state]: true = kunci, false = jawaban salah, null = biasa.
class _Option extends StatelessWidget {
  const _Option({required this.text, required this.selected, required this.state, this.onTap});

  final String text;
  final bool selected;
  final bool? state;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final good = Colors.green.shade700;
    final color = switch (state) {
      true => good,
      false => scheme.error,
      null => selected ? scheme.primary : scheme.outlineVariant,
    };
    final icon = switch (state) {
      true => Icons.check_circle,
      false => Icons.cancel,
      null => selected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
    };
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: state == null && !selected ? Colors.transparent : color.withValues(alpha: 0.08),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: color, width: selected || state != null ? 2 : 1),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            child: Row(
              children: [
                Icon(icon, color: color),
                const SizedBox(width: 12),
                Expanded(child: Text(text)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
