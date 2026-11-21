import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/providers.dart';
import '../../data/course_repository.dart';
import '../../domain/l10n_text.dart';
import '../../l10n/app_localizations.dart';
import '../../widgets/async_view.dart';

/// Detail kelas + daftar pelajaran. Pemutar pelajaran menyusul (Fase 1).
class CourseDetailScreen extends ConsumerWidget {
  const CourseDetailScreen({super.key, required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final locale = ref.watch(localeProvider).languageCode;
    final course = ref.watch(courseProvider(slug));
    final lessons = ref.watch(lessonsProvider(slug));
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: Text(pickText(course.value?.title, locale))),
      body: AsyncView(
        value: lessons,
        onRetry: () {
          ref.invalidate(courseProvider(slug));
          ref.invalidate(lessonsProvider(slug));
        },
        builder: (list) => ListView(
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
            for (final (i, l) in list.indexed)
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(child: Text('${i + 1}')),
                title: Text(pickText(l.title, locale)),
                subtitle: Text(t.minutes(l.minutes)),
                trailing: l.freePreview ? Chip(label: Text(t.freePreview)) : null,
              ),
          ],
        ),
      ),
    );
  }
}
