import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/providers.dart';
import '../../data/course_repository.dart';
import '../../data/lesson_repository.dart';
import '../../data/quiz_repository.dart';
import '../../domain/course_progress.dart';
import '../../domain/l10n_text.dart';
import '../../domain/quiz.dart';
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
              const SizedBox(height: 12),
              _QuizCard(slug: slug),
              _CertificateCard(slug: slug, doneLessons: doneCount, totalLessons: ids.length),
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

/// Kartu kuis: jumlah soal, skor terbaik, tombol kerjakan/ulangi.
class _QuizCard extends ConsumerWidget {
  const _QuizCard({required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final count = ref.watch(quizQuestionsProvider(slug)).value?.length ?? 0;
    if (count == 0) return const SizedBox.shrink();
    final best = bestAttempt(ref.watch(attemptsProvider).value ?? const [], slug);
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: const Icon(Icons.quiz_outlined),
        title: Text(best == null ? t.takeQuiz : t.retakeQuiz),
        subtitle: Text(best == null ? t.quizCount(count) : t.quizBest(best.score, best.total)),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => context.push('/courses/$slug/quiz'),
      ),
    );
  }
}

/// Sertifikat: syarat (semua pelajaran + skor kuis), ambil, atau lihat.
class _CertificateCard extends ConsumerStatefulWidget {
  const _CertificateCard({required this.slug, required this.doneLessons, required this.totalLessons});

  final String slug;
  final int doneLessons;
  final int totalLessons;

  @override
  ConsumerState<_CertificateCard> createState() => _CertificateCardState();
}

class _CertificateCardState extends ConsumerState<_CertificateCard> {
  bool _busy = false;

  Future<void> _claim() async {
    setState(() => _busy = true);
    final t = AppLocalizations.of(context);
    try {
      final code = await claimCertificate(ref, widget.slug);
      if (mounted) context.push('/certificates/$code');
    } on CertificateException catch (e) {
      if (!mounted) return;
      final msg = switch (e.error) {
        CertificateError.notComplete => t.certNotComplete,
        CertificateError.quizRequired => t.certQuizRequired(certificateMinPercent),
        CertificateError.noAccess => t.certNoAccess,
        CertificateError.generic => t.certGeneric,
      };
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(t.certGeneric)));
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final scheme = Theme.of(context).colorScheme;
    final owned = (ref.watch(certificatesProvider).value ?? const <Certificate>[])
        .where((c) => c.courseSlug == widget.slug)
        .firstOrNull;
    final quizCount = ref.watch(quizQuestionsProvider(widget.slug)).value?.length ?? 0;
    final best = bestAttempt(ref.watch(attemptsProvider).value ?? const [], widget.slug);
    final status = certificateStatus(
      doneLessons: widget.doneLessons,
      totalLessons: widget.totalLessons,
      quizCount: quizCount,
      best: best == null ? null : (score: best.score, total: best.total),
    );
    final lessonsOk = widget.totalLessons > 0 && widget.doneLessons >= widget.totalLessons;
    final quizOk = status == CertificateStatus.ready;

    Widget req(bool ok, String text) => Row(
          children: [
            Icon(ok ? Icons.check_circle : Icons.radio_button_unchecked,
                size: 20, color: ok ? scheme.primary : scheme.outline),
            const SizedBox(width: 8),
            Expanded(child: Text(text)),
          ],
        );

    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                const Icon(Icons.workspace_premium_outlined),
                const SizedBox(width: 12),
                Text(t.certificateTitle, style: Theme.of(context).textTheme.titleMedium),
              ],
            ),
            const SizedBox(height: 12),
            if (owned != null)
              FilledButton.icon(
                onPressed: () => context.push('/certificates/${owned.code}'),
                icon: const Icon(Icons.visibility_outlined),
                label: Text(t.viewCertificate),
              )
            else ...[
              req(lessonsOk, t.reqLessons(widget.doneLessons, widget.totalLessons)),
              if (quizCount > 0) ...[
                const SizedBox(height: 6),
                req(quizOk, t.reqQuiz(certificateMinPercent)),
              ],
              const SizedBox(height: 12),
              FilledButton.tonal(
                onPressed: status == CertificateStatus.ready && !_busy ? _claim : null,
                child: Text(t.claimCertificate),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
