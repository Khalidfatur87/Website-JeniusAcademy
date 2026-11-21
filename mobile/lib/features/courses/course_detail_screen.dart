import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/providers.dart';
import '../../data/course_repository.dart';
import '../../data/lesson_repository.dart';
import '../../domain/course_progress.dart';
import '../../domain/l10n_text.dart';
import '../../l10n/app_localizations.dart';
import '../../widgets/async_view.dart';

/// Detail kelas: progres, tombol mulai/lanjutkan, daftar pelajaran.
class CourseDetailScreen extends ConsumerWidget {
  const CourseDetailScreen({super.key, required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final locale = ref.watch(localeProvider).languageCode;
    final course = ref.watch(courseProvider(slug));
    final lessons = ref.watch(lessonsProvider(slug));
    final done = ref.watch(progressProvider).value?[slug] ?? const <String>{};
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: Text(pickText(course.value?.title, locale))),
      body: AsyncView(
        value: lessons,
        onRetry: () {
          ref.invalidate(courseProvider(slug));
          ref.invalidate(lessonsProvider(slug));
        },
        builder: (list) {
          final ids = [for (final l in list) l.id];
          final doneCount = ids.where(done.contains).length;
          final resume = resumeLesson(ids, done);
          final label = doneCount == 0
              ? t.startCourse
              : doneCount == ids.length
                  ? t.reviewCourse
                  : t.resumeCourse;

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (course.value case final c?) ...[
                Text(pickText(c.summary, locale), style: theme.textTheme.bodyLarge),
                if (c.teacherName.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(t.teacher(c.teacherName), style: theme.textTheme.bodySmall),
                ],
                const SizedBox(height: 16),
              ],
              Card(
                margin: EdgeInsets.zero,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(t.completedOf(doneCount, ids.length)),
                      const SizedBox(height: 8),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: LinearProgressIndicator(
                          value: coursePercent(doneCount, ids.length) / 100,
                          minHeight: 8,
                        ),
                      ),
                      const SizedBox(height: 16),
                      FilledButton.icon(
                        onPressed: resume == null
                            ? null
                            : () => context.push('/courses/$slug/$resume'),
                        icon: const Icon(Icons.play_arrow),
                        label: Text(label),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text(t.lessonList, style: theme.textTheme.titleMedium),
              const SizedBox(height: 8),
              for (final (i, l) in list.indexed)
                _LessonTile(
                  number: i + 1,
                  lesson: l,
                  locale: locale,
                  done: done.contains(l.id),
                  onTap: () => context.push('/courses/$slug/${l.id}'),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _LessonTile extends StatelessWidget {
  const _LessonTile({
    required this.number,
    required this.lesson,
    required this.locale,
    required this.done,
    required this.onTap,
  });

  final int number;
  final LessonSummary lesson;
  final String locale;
  final bool done;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final scheme = Theme.of(context).colorScheme;
    return ListTile(
      contentPadding: EdgeInsets.zero,
      onTap: onTap,
      leading: CircleAvatar(
        backgroundColor: done ? scheme.primary : scheme.primaryContainer,
        foregroundColor: done ? scheme.onPrimary : scheme.onPrimaryContainer,
        child: done ? const Icon(Icons.check) : Text('$number'),
      ),
      title: Text(pickText(lesson.title, locale)),
      subtitle: Text(t.minutes(lesson.minutes)),
      trailing: lesson.freePreview ? Chip(label: Text(t.freePreview)) : null,
    );
  }
}
