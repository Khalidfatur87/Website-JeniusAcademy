import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/providers.dart';
import '../../data/classes_repository.dart';
import '../../domain/l10n_text.dart';
import '../../l10n/app_localizations.dart';
import '../../widgets/async_view.dart';

/// Kelas sekolah: gabung dengan kode, daftar tugas & tenggat, kelas yang diikuti.
class ClassesScreen extends ConsumerStatefulWidget {
  const ClassesScreen({super.key});

  @override
  ConsumerState<ClassesScreen> createState() => _ClassesScreenState();
}

class _ClassesScreenState extends ConsumerState<ClassesScreen> {
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

  void _refresh() {
    ref.invalidate(myClassroomsProvider);
    ref.invalidate(myAssignmentsProvider);
  }

  Future<void> _join() async {
    final t = AppLocalizations.of(context);
    if (_code.text.trim().isEmpty) return;
    setState(() => _busy = true);
    try {
      final name = await ref.read(classesRepositoryProvider).join(_code.text);
      _code.clear();
      _refresh();
      if (mounted) _snack(t.classesJoined(name));
    } on JoinException catch (e) {
      if (mounted) {
        _snack(switch (e.error) {
          JoinError.invalidCode => t.classesErrInvalid,
          JoinError.ownClass => t.classesErrOwn,
          JoinError.generic => t.classesErrGeneric,
        });
      }
    } catch (_) {
      if (mounted) _snack(t.classesErrGeneric);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _leave(MyClassroom c) async {
    final t = AppLocalizations.of(context);
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        content: Text(t.classesConfirmLeave(c.name)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(t.cancel),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(t.classesLeave),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ref.read(classesRepositoryProvider).leave(c.id);
      _refresh();
    } catch (_) {
      if (mounted) _snack(t.saveFailed);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final theme = Theme.of(context);
    final classrooms =
        ref.watch(myClassroomsProvider).value ?? const <MyClassroom>[];

    return Scaffold(
      appBar: AppBar(title: Text(t.classesTitle)),
      body: RefreshIndicator(
        onRefresh: () async {
          _refresh();
          await ref.read(myAssignmentsProvider.future);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(t.classesSubtitle),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _code,
                    textCapitalization: TextCapitalization.characters,
                    decoration: InputDecoration(
                      labelText: t.classesCode,
                      isDense: true,
                    ),
                    onSubmitted: (_) => _join(),
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton(
                  onPressed: _busy ? null : _join,
                  child: Text(t.classesJoin),
                ),
              ],
            ),
            const SizedBox(height: 24),
            AsyncView(
              value: ref.watch(myAssignmentsProvider),
              onRetry: () => ref.invalidate(myAssignmentsProvider),
              builder: (list) {
                final todo = list.where((a) => !a.done).toList();
                final done = list.where((a) => a.done).toList();
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(t.classesTodo, style: theme.textTheme.titleMedium),
                    const SizedBox(height: 8),
                    if (list.isEmpty)
                      Text(t.classesNoTasks)
                    else if (todo.isEmpty)
                      Text(t.classesAllDone),
                    for (final a in todo) _AssignmentCard(assignment: a),
                    if (done.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Text(t.classesDone, style: theme.textTheme.titleMedium),
                      const SizedBox(height: 8),
                      for (final a in done) _AssignmentCard(assignment: a),
                    ],
                  ],
                );
              },
            ),
            if (classrooms.isNotEmpty) ...[
              const SizedBox(height: 24),
              Text(t.classesMine, style: theme.textTheme.titleMedium),
              for (final c in classrooms)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.groups_outlined),
                  title: Text(c.name),
                  trailing: TextButton(
                    onPressed: () => _leave(c),
                    child: Text(t.classesLeave),
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }
}

class _AssignmentCard extends ConsumerWidget {
  const _AssignmentCard({required this.assignment});

  final Assignment assignment;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final theme = Theme.of(context);
    final locale = ref.watch(localeProvider);
    final now = ref.watch(clockProvider)();
    final a = assignment;
    final date = a.dueAt == null
        ? null
        : DateFormat.yMMMd(locale.toString())
              .add_Hm()
              .format(a.dueAt!.toLocal());
    final kind = switch (a.kind) {
      AssignmentKind.lesson => t.classesKindLesson,
      AssignmentKind.quiz => t.classesKindQuiz,
      AssignmentKind.course => t.classesKindCourse,
    };
    final overdue = a.isOverdue(now);
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${a.classroomName} · $kind',
              style: theme.textTheme.labelMedium,
            ),
            const SizedBox(height: 4),
            Text(a.title, style: theme.textTheme.titleMedium),
            Text(
              pickText(a.courseTitle, locale.languageCode),
              style: theme.textTheme.bodySmall,
            ),
            if (a.instructions.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(a.instructions),
            ],
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: Text(
                    [
                      if (date == null)
                        t.classesNoDue
                      else if (overdue)
                        t.classesOverdue(date)
                      else
                        t.classesDue(date),
                      if (a.percent != null) t.classesScore(a.percent!),
                      if (a.doneCount != null && a.total != null)
                        '${a.doneCount}/${a.total}',
                    ].join(' · '),
                    style: TextStyle(
                      color: overdue ? theme.colorScheme.error : null,
                    ),
                  ),
                ),
                if (a.done)
                  Icon(Icons.check_circle, color: Colors.green.shade700)
                else
                  FilledButton.tonal(
                    onPressed: () => context.push(a.route),
                    child: Text(t.classesStart),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
