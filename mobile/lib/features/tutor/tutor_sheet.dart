import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/providers.dart';
import '../../data/tutor_repository.dart';
import '../../l10n/app_localizations.dart';

String tutorErrorText(AppLocalizations t, Object e) => switch (e) {
  TutorException(error: TutorError.invalid) => t.tutorErrInvalid,
  TutorException(error: TutorError.notSignedIn) => t.tutorErrNotSignedIn,
  TutorException(error: TutorError.noAccess) => t.tutorErrNoAccess,
  TutorException(error: TutorError.quota) => t.tutorErrQuota,
  TutorException(error: TutorError.notConfigured) => t.tutorErrNotConfigured,
  _ => t.tutorErrGeneric,
};

/// Panel "Tanya AI" untuk satu pelajaran: percakapan dengan jawaban bertahap.
class TutorSheet extends ConsumerStatefulWidget {
  const TutorSheet({super.key, required this.slug, required this.lessonId});

  final String slug;
  final String lessonId;

  static Future<void> show(
    BuildContext context, {
    required String slug,
    required String lessonId,
  }) => showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (_) => FractionallySizedBox(
      heightFactor: 0.9,
      child: TutorSheet(slug: slug, lessonId: lessonId),
    ),
  );

  @override
  ConsumerState<TutorSheet> createState() => _TutorSheetState();
}

class _TutorSheetState extends ConsumerState<TutorSheet> {
  final _turns = <TutorTurn>[];
  final _text = TextEditingController();
  final _scroll = ScrollController();
  StreamSubscription<String>? _sub;
  String? _streaming;
  String? _error;

  @override
  void dispose() {
    _sub?.cancel();
    _text.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _toBottom() => WidgetsBinding.instance.addPostFrameCallback((_) {
    if (_scroll.hasClients) _scroll.jumpTo(_scroll.position.maxScrollExtent);
  });

  void _send() {
    final question = _text.text.trim();
    if (question.isEmpty || _streaming != null) return;
    final history = List.of(_turns);
    setState(() {
      _turns.add((role: 'user', content: question));
      _streaming = '';
      _error = null;
      _text.clear();
    });
    _toBottom();
    final stream = ref
        .read(tutorRepositoryProvider)
        .askLesson(
          slug: widget.slug,
          lessonId: widget.lessonId,
          question: question,
          history: history,
          locale: ref.read(localeProvider).languageCode,
        );
    _sub = stream.listen(
      (chunk) {
        setState(() => _streaming = (_streaming ?? '') + chunk);
        _toBottom();
      },
      onError: (Object e) => setState(() {
        _turns.removeLast(); // pertanyaan gagal tidak masuk riwayat
        _streaming = null;
        _error = tutorErrorText(AppLocalizations.of(context), e);
      }),
      onDone: () => setState(() {
        if (_streaming != null && _streaming!.isNotEmpty) {
          _turns.add((role: 'assistant', content: _streaming!));
        }
        _streaming = null;
      }),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    Widget bubble(String who, String text, bool mine) => Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        constraints: const BoxConstraints(maxWidth: 520),
        decoration: BoxDecoration(
          color: mine
              ? scheme.primaryContainer
              : scheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(who, style: theme.textTheme.labelSmall),
            const SizedBox(height: 2),
            SelectableText(text),
          ],
        ),
      ),
    );

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: Column(
        children: [
          ListTile(
            leading: const Icon(Icons.auto_awesome),
            title: Text(t.tutorTitle),
            subtitle: Text(t.tutorSubtitle),
            trailing: IconButton(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.close),
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: ListView(
              controller: _scroll,
              padding: const EdgeInsets.all(16),
              children: [
                if (_turns.isEmpty && _streaming == null)
                  Text(t.tutorEmpty, style: theme.textTheme.bodySmall),
                for (final turn in _turns)
                  bubble(
                    turn.role == 'user' ? t.tutorYou : t.tutorName,
                    turn.content,
                    turn.role == 'user',
                  ),
                if (_streaming != null)
                  bubble(
                    t.tutorName,
                    _streaming!.isEmpty ? t.tutorThinking : _streaming!,
                    false,
                  ),
                if (_error != null)
                  Text(_error!, style: TextStyle(color: scheme.error)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 4),
            child: Text(t.tutorDisclaimer, style: theme.textTheme.bodySmall),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 4, 12, 8),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _text,
                      minLines: 1,
                      maxLines: 4,
                      maxLength: 1000,
                      buildCounter: (
                        _, {
                        required currentLength,
                        required isFocused,
                        maxLength,
                      }) => null,
                      decoration: InputDecoration(
                        hintText: t.tutorPlaceholder,
                        isDense: true,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    tooltip: t.send,
                    onPressed: _streaming == null ? _send : null,
                    icon: const Icon(Icons.send),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Penjelasan AI untuk satu soal kuis yang salah (muncul di bawah pembahasan).
class ExplainWithAi extends ConsumerStatefulWidget {
  const ExplainWithAi({
    super.key,
    required this.questionId,
    required this.chosen,
  });

  final String questionId;
  final int? chosen;

  @override
  ConsumerState<ExplainWithAi> createState() => _ExplainWithAiState();
}

class _ExplainWithAiState extends ConsumerState<ExplainWithAi> {
  StreamSubscription<String>? _sub;
  String? _text;
  String? _error;

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  void _start() {
    setState(() {
      _text = '';
      _error = null;
    });
    _sub = ref
        .read(tutorRepositoryProvider)
        .explainQuiz(
          questionId: widget.questionId,
          chosen: widget.chosen,
          locale: ref.read(localeProvider).languageCode,
        )
        .listen(
          (c) => setState(() => _text = (_text ?? '') + c),
          onError: (Object e) => setState(() {
            _text = null;
            _error = tutorErrorText(AppLocalizations.of(context), e);
          }),
        );
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final theme = Theme.of(context);
    if (_text == null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextButton.icon(
            onPressed: _start,
            icon: const Icon(Icons.auto_awesome, size: 18),
            label: Text(t.tutorExplain),
          ),
          if (_error != null)
            Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
        ],
      );
    }
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(_text!.isEmpty ? t.tutorThinking : _text!),
    );
  }
}
