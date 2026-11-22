import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/providers.dart';
import '../../data/tryout_repository.dart';
import '../../domain/l10n_text.dart';
import '../../domain/tryout.dart';
import '../../l10n/app_localizations.dart';
import '../../widgets/answer_option.dart';

enum _SaveState { idle, saving, saved, failed }

/// Mengerjakan try-out. Waktu dihitung dari `started_at` milik server, jadi
/// menutup aplikasi tidak menghentikan waktu; jawaban disimpan otomatis.
class TryoutTakeScreen extends ConsumerStatefulWidget {
  const TryoutTakeScreen({super.key, required this.slug});

  final String slug;

  @override
  ConsumerState<TryoutTakeScreen> createState() => _TryoutTakeScreenState();
}

class _TryoutTakeScreenState extends ConsumerState<TryoutTakeScreen> with WidgetsBindingObserver {
  TryoutSession? _session;
  TryoutError? _error;
  final _answers = <String, int>{};
  int _finishedThrough = -1;
  int _shownSection = -1;
  bool _dirty = false;
  bool _submitting = false;
  _SaveState _save = _SaveState.idle;
  Timer? _tick;
  Timer? _debounce;
  Timer? _periodicSave;
  final _scroll = ScrollController();

  String get _prefKey => 'tryout.${widget.slug}.finished';
  TryoutRepository get _repo => ref.read(tryoutRepositoryProvider);
  DateTime _now() => ref.read(clockProvider)();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _finishedThrough = ref.read(preferencesProvider)?.getInt(_prefKey) ?? -1;
    _load();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _tick?.cancel();
    _debounce?.cancel();
    _periodicSave?.cancel();
    _scroll.dispose();
    super.dispose();
  }

  /// Aplikasi ditinggal (pindah aplikasi / layar mati) → simpan sekarang.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.paused || state == AppLifecycleState.inactive) _saveNow();
  }

  Future<void> _load() async {
    try {
      final s = await _repo.start(widget.slug);
      if (!mounted) return;
      if (s.submitted) return _leave();
      setState(() {
        _session = s;
        _answers.addAll(s.answers);
      });
      _tick = Timer.periodic(const Duration(seconds: 1), (_) => _onTick());
      _periodicSave = Timer.periodic(const Duration(seconds: 30), (_) => _saveNow());
      _onTick();
    } on TryoutException catch (e) {
      if (mounted) setState(() => _error = e.error);
    } catch (_) {
      if (mounted) setState(() => _error = TryoutError.generic);
    }
  }

  ({int index, int secondsLeft}) _current() {
    final s = _session!;
    return currentSection(
      [for (final x in s.sections) x.minutes],
      s.startedAt,
      _now(),
      finishedThrough: _finishedThrough,
    );
  }

  void _onTick() {
    if (_session == null || _submitting) return;
    final cur = _current();
    if (cur.index >= _session!.sections.length) {
      _submit(); // waktu semua subtes habis → serahkan otomatis
      return;
    }
    if (cur.index != _shownSection) {
      _shownSection = cur.index;
      if (_scroll.hasClients) _scroll.jumpTo(0);
    }
    setState(() {});
  }

  void _choose(String questionId, int choice) {
    setState(() {
      _answers[questionId] = choice;
      _dirty = true;
    });
    _debounce?.cancel();
    _debounce = Timer(const Duration(seconds: 2), _saveNow);
  }

  Future<void> _saveNow() async {
    if (!_dirty || _session == null || _submitting) return;
    _dirty = false;
    if (mounted) setState(() => _save = _SaveState.saving);
    try {
      await _repo.save(widget.slug, Map.of(_answers));
      if (mounted) setState(() => _save = _SaveState.saved);
    } catch (_) {
      _dirty = true; // dicoba lagi pada simpan berikutnya
      if (mounted) setState(() => _save = _SaveState.failed);
    }
  }

  Future<bool> _confirm(String text) async =>
      await showDialog<bool>(
        context: context,
        builder: (context) {
          final t = AppLocalizations.of(context);
          return AlertDialog(
            content: Text(text),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context, false), child: Text(t.cancel)),
              FilledButton(onPressed: () => Navigator.pop(context, true), child: Text(t.continueAction)),
            ],
          );
        },
      ) ??
      false;

  int _unanswered(TryoutPaperSection s) => s.questions.where((q) => !_answers.containsKey(q.id)).length;

  Future<void> _nextSection(int index) async {
    final t = AppLocalizations.of(context);
    if (!await _confirm(t.tryoutConfirmNext(_unanswered(_session!.sections[index])))) return;
    _finishedThrough = index;
    await ref.read(preferencesProvider)?.setInt(_prefKey, index);
    _dirty = true;
    await _saveNow();
    _onTick();
  }

  Future<void> _confirmSubmit(int index) async {
    final t = AppLocalizations.of(context);
    final empty = _session!.sections.skip(index).fold(0, (n, s) => n + _unanswered(s));
    if (await _confirm(t.tryoutConfirmSubmit(empty))) await _submit();
  }

  Future<void> _submit() async {
    if (_submitting) return;
    setState(() => _submitting = true);
    _tick?.cancel();
    _periodicSave?.cancel();
    _debounce?.cancel();
    try {
      await _repo.submit(widget.slug, Map.of(_answers));
      await ref.read(preferencesProvider)?.remove(_prefKey);
      refreshAfterTryout(ref, widget.slug);
      _leave();
    } catch (_) {
      if (!mounted) return;
      setState(() => _submitting = false);
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(AppLocalizations.of(context).submitFailed)));
      _tick = Timer.periodic(const Duration(seconds: 1), (_) => _onTick());
    }
  }

  void _leave() {
    if (!mounted) return;
    if (context.canPop()) {
      context.pop();
    } else {
      context.go('/tryouts/${widget.slug}');
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final theme = Theme.of(context);
    final locale = ref.watch(localeProvider).languageCode;
    final session = _session;

    if (_error != null) {
      final msg = switch (_error!) {
        TryoutError.noAccess => t.tryoutErrNoAccess,
        TryoutError.closed => t.tryoutErrClosed,
        TryoutError.notSignedIn => t.tryoutErrNotSignedIn,
        TryoutError.generic => t.tryoutErrGeneric,
      };
      return Scaffold(
        appBar: AppBar(title: Text(t.tryoutTitle)),
        body: Center(child: Padding(padding: const EdgeInsets.all(32), child: Text(msg, textAlign: TextAlign.center))),
      );
    }
    if (session == null || _submitting) {
      return Scaffold(
        appBar: AppBar(title: Text(t.tryoutTitle)),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(),
              if (_submitting) ...[const SizedBox(height: 12), Text(t.tryoutSubmitting)],
            ],
          ),
        ),
      );
    }

    final cur = _current();
    final index = cur.index.clamp(0, session.sections.length - 1);
    final section = session.sections[index];
    final last = index == session.sections.length - 1;
    final answered = section.questions.where((q) => _answers.containsKey(q.id)).length;
    final low = cur.secondsLeft <= 60;
    final saveText = switch (_save) {
      _SaveState.idle => '',
      _SaveState.saving => t.tryoutSaving,
      _SaveState.saved => t.tryoutSaved,
      _SaveState.failed => t.tryoutSaveFailed,
    };

    return Scaffold(
      appBar: AppBar(
        title: Text(t.tryoutSectionOf(index + 1, session.sections.length)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Text(
                formatClock(cur.secondsLeft),
                key: const Key('tryout-clock'),
                style: theme.textTheme.titleLarge?.copyWith(
                  color: low ? theme.colorScheme.error : null,
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
            ),
          ),
        ],
      ),
      body: ListView(
        controller: _scroll,
        padding: const EdgeInsets.all(16),
        children: [
          Text(pickText(section.title, locale), style: theme.textTheme.titleLarge),
          const SizedBox(height: 4),
          Row(
            children: [
              Text(t.tryoutAnsweredOf(answered, section.questions.length)),
              const Spacer(),
              Text(saveText, style: theme.textTheme.bodySmall),
            ],
          ),
          const SizedBox(height: 12),
          for (final (i, q) in section.questions.indexed)
            Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(t.questionNumber(i + 1), style: theme.textTheme.labelLarge),
                    const SizedBox(height: 8),
                    Text(pickText(q.prompt, locale), style: theme.textTheme.titleMedium),
                    const SizedBox(height: 12),
                    for (final (j, option) in q.options.indexed)
                      AnswerOption(
                        text: pickText(option, locale),
                        selected: _answers[q.id] == j,
                        state: null,
                        onTap: () => _choose(q.id, j),
                      ),
                  ],
                ),
              ),
            ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: FilledButton(
            onPressed: () => last ? _confirmSubmit(index) : _nextSection(index),
            child: Text(last ? t.tryoutSubmit : t.tryoutNextSection),
          ),
        ),
      ),
    );
  }
}
