import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/providers.dart';
import '../../data/parent_repository.dart';
import '../../domain/activity.dart';
import '../../domain/course_progress.dart';
import '../../domain/l10n_text.dart';
import '../../l10n/app_localizations.dart';
import '../../widgets/async_view.dart';

/// Pantauan orang tua: tautkan dengan kode dari anak, lihat ringkasan belajarnya.
class ParentScreen extends ConsumerStatefulWidget {
  const ParentScreen({super.key});

  @override
  ConsumerState<ParentScreen> createState() => _ParentScreenState();
}

class _ParentScreenState extends ConsumerState<ParentScreen> {
  final _code = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  void _snack(String text) => ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(text)));

  Future<void> _link() async {
    final t = AppLocalizations.of(context);
    if (_code.text.trim().isEmpty) return;
    setState(() => _busy = true);
    try {
      final name = await ref.read(parentRepositoryProvider).redeem(_code.text);
      _code.clear();
      ref.invalidate(childrenProvider);
      if (mounted) _snack(t.parentLinked(name));
    } on ParentLinkException catch (e) {
      if (mounted) {
        _snack(switch (e.error) {
          ParentLinkError.invalidCode => t.parentErrInvalid,
          ParentLinkError.ownCode => t.parentErrOwn,
          ParentLinkError.generic => t.parentErrGeneric,
        });
      }
    } catch (_) {
      if (mounted) _snack(t.parentErrGeneric);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _unlink(ChildSummary c) async {
    final t = AppLocalizations.of(context);
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        content: Text(t.parentConfirmUnlink(c.name)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(t.cancel)),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: Text(t.parentUnlink)),
        ],
      ),
    );
    if (ok != true) return;
    await ref.read(parentRepositoryProvider).unlinkChild(c.studentId);
    ref.invalidate(childrenProvider);
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(t.parentTitle)),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(childrenProvider.future),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(t.parentSubtitle),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _code,
                    textCapitalization: TextCapitalization.characters,
                    decoration: InputDecoration(labelText: t.parentCode, isDense: true),
                    onSubmitted: (_) => _link(),
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton(onPressed: _busy ? null : _link, child: Text(t.parentLink)),
              ],
            ),
            const SizedBox(height: 4),
            Text(t.parentCodeHint, style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 20),
            AsyncView(
              value: ref.watch(childrenProvider),
              onRetry: () => ref.invalidate(childrenProvider),
              builder: (list) => list.isEmpty
                  ? Text(t.parentEmpty)
                  : Column(children: [for (final c in list) _ChildCard(child: c, onUnlink: () => _unlink(c))]),
            ),
          ],
        ),
      ),
    );
  }
}

class _ChildCard extends ConsumerWidget {
  const _ChildCard({required this.child, required this.onUnlink});

  final ChildSummary child;
  final VoidCallback onUnlink;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final theme = Theme.of(context);
    final locale = ref.watch(localeProvider);
    final c = child;
    final streak = currentStreak(c.activeDays, ref.watch(clockProvider)());
    final last = c.lastActive == null
        ? t.parentNeverActive
        : t.parentLastActive(DateFormat.yMMMd(locale.toString()).add_Hm().format(c.lastActive!.toLocal()));

    Widget stat(String label, String value) => Expanded(
          child: Column(
            children: [
              Text(value, style: theme.textTheme.titleLarge),
              Text(label, style: theme.textTheme.bodySmall, textAlign: TextAlign.center),
            ],
          ),
        );

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(c.name, style: theme.textTheme.titleLarge),
            Text(last, style: theme.textTheme.bodySmall),
            const SizedBox(height: 12),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                stat(t.parentStreak, t.days(streak)),
                stat(t.parentLessonsWeek, '${c.lessonsWeek}'),
                stat(t.parentQuizzesWeek, '${c.quizzesWeek}'),
                stat(t.parentAvgQuiz, c.avgQuizPercent == null ? '-' : '${c.avgQuizPercent}%'),
              ],
            ),
            if (c.courses.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text(t.parentCourses, style: theme.textTheme.titleSmall),
              for (final course in c.courses) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(child: Text(pickText(course.title, locale.languageCode))),
                    Text('${course.done}/${course.total}'),
                  ],
                ),
                const SizedBox(height: 4),
                LinearProgressIndicator(value: coursePercent(course.done, course.total) / 100),
              ],
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                TextButton.icon(
                  onPressed: () async {
                    await Clipboard.setData(ClipboardData(
                      text: t.parentShareText(c.name, c.lessonsWeek, c.quizzesWeek, streak),
                    ));
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(t.copied)));
                    }
                  },
                  icon: const Icon(Icons.copy, size: 18),
                  label: Text(t.parentCopySummary),
                ),
                const Spacer(),
                TextButton(onPressed: onUnlink, child: Text(t.parentUnlink)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Bagian di Profil siswa: buat kode untuk orang tua & lepaskan orang tua.
class ParentLinkSection extends ConsumerStatefulWidget {
  const ParentLinkSection({super.key});

  @override
  ConsumerState<ParentLinkSection> createState() => _ParentLinkSectionState();
}

class _ParentLinkSectionState extends ConsumerState<ParentLinkSection> {
  ({String code, DateTime expiresAt})? _code;
  bool _busy = false;

  Future<void> _create() async {
    setState(() => _busy = true);
    try {
      final code = await ref.read(parentRepositoryProvider).createCode();
      setState(() => _code = code);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(AppLocalizations.of(context).saveFailed)));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _unlink(LinkedParent p) async {
    final t = AppLocalizations.of(context);
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        content: Text(t.parentConfirmUnlinkParent(p.name)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(t.cancel)),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: Text(t.parentUnlink)),
        ],
      ),
    );
    if (ok != true) return;
    await ref.read(parentRepositoryProvider).unlinkParent(p.parentId);
    ref.invalidate(myParentsProvider);
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final theme = Theme.of(context);
    final parents = ref.watch(myParentsProvider).value ?? const <LinkedParent>[];
    final code = _code;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(t.parentProfileTitle, style: theme.textTheme.titleSmall),
        const SizedBox(height: 4),
        Text(t.parentProfileHint, style: theme.textTheme.bodySmall),
        const SizedBox(height: 8),
        if (code != null)
          Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              title: SelectableText(
                code.code,
                style: theme.textTheme.headlineSmall?.copyWith(letterSpacing: 4, fontWeight: FontWeight.w700),
              ),
              subtitle: Text(t.parentCodeExpires(
                DateFormat.yMMMMd(ref.watch(localeProvider).toString()).format(code.expiresAt.toLocal()),
              )),
              trailing: IconButton(
                tooltip: t.copied,
                icon: const Icon(Icons.copy),
                onPressed: () => Clipboard.setData(ClipboardData(text: code.code)),
              ),
            ),
          ),
        OutlinedButton(onPressed: _busy ? null : _create, child: Text(t.parentCreateCode)),
        for (final p in parents)
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.family_restroom),
            title: Text(p.name),
            trailing: TextButton(onPressed: () => _unlink(p), child: Text(t.parentUnlink)),
          ),
      ],
    );
  }
}
