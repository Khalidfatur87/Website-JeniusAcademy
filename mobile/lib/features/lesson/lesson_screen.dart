import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/env.dart';
import '../../core/providers.dart';
import '../../data/course_repository.dart';
import '../../data/lesson_repository.dart';
import '../../domain/course_progress.dart';
import '../../domain/l10n_text.dart';
import '../../l10n/app_localizations.dart';
import '../../widgets/async_view.dart';
import 'youtube_view.dart';

/// Tampilan video; diganti di mode demo dan tes (tanpa WebView).
final videoViewProvider = Provider<Widget Function(String videoId)>(
  (ref) => (id) => YoutubeView(videoId: id),
);

/// Pemutar pelajaran: video, catatan, materi, tandai selesai, pindah pelajaran.
class LessonScreen extends ConsumerWidget {
  const LessonScreen({super.key, required this.slug, required this.lessonId});

  final String slug;
  final String lessonId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final locale = ref.watch(localeProvider).languageCode;
    final key = (slug: slug, lessonId: lessonId);
    final content = ref.watch(lessonContentProvider(key));
    final lessons = ref.watch(lessonsProvider(slug)).value ?? const <LessonSummary>[];
    final lesson = lessons.where((l) => l.id == lessonId).firstOrNull;
    final ids = [for (final l in lessons) l.id];
    final nav = lessonNeighbors(ids, lessonId);
    final index = ids.indexOf(lessonId);

    return Scaffold(
      appBar: AppBar(
        title: Text(pickText(lesson?.title, locale), maxLines: 1, overflow: TextOverflow.ellipsis),
      ),
      body: AsyncView(
        value: content,
        onRetry: () => ref.invalidate(lessonContentProvider(key)),
        builder: (c) {
          if (c == null || !c.access) return _Locked(slug: slug);
          final notes = pickText(c.notes, locale).trim();
          final theme = Theme.of(context);
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (c.youtubeId.isNotEmpty)
                ref.watch(videoViewProvider)(c.youtubeId)
              else
                _InfoBox(icon: Icons.videocam_off_outlined, text: t.videoUnavailable),
              const SizedBox(height: 16),
              if (index >= 0)
                Text(
                  '${index + 1}/${ids.length} · ${t.minutes(lesson?.minutes ?? 0)}',
                  style: theme.textTheme.bodySmall,
                ),
              Text(pickText(lesson?.title, locale), style: theme.textTheme.titleLarge),
              if (notes.isNotEmpty) ...[
                const SizedBox(height: 24),
                Text(t.lessonNotes, style: theme.textTheme.titleMedium),
                const SizedBox(height: 8),
                Card(
                  margin: EdgeInsets.zero,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: SelectableText(notes, style: theme.textTheme.bodyLarge),
                  ),
                ),
              ],
              if (c.materials.isNotEmpty) ...[
                const SizedBox(height: 24),
                Text(t.lessonMaterials, style: theme.textTheme.titleMedium),
                const SizedBox(height: 8),
                for (final m in c.materials) _MaterialTile(material: m),
              ],
            ],
          );
        },
      ),
      bottomNavigationBar: content.value?.access == true
          ? _LessonBar(slug: slug, lessonId: lessonId, next: nav.next)
          : null,
    );
  }
}

/// Tombol tandai selesai + pelajaran berikutnya.
class _LessonBar extends ConsumerStatefulWidget {
  const _LessonBar({required this.slug, required this.lessonId, required this.next});

  final String slug;
  final String lessonId;
  final String? next;

  @override
  ConsumerState<_LessonBar> createState() => _LessonBarState();
}

class _LessonBarState extends ConsumerState<_LessonBar> {
  bool _busy = false;

  Future<void> _toggle(bool done) async {
    setState(() => _busy = true);
    final ok = await ref.read(progressProvider.notifier).setDone(widget.slug, widget.lessonId, done);
    if (!mounted) return;
    setState(() => _busy = false);
    if (!ok) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(AppLocalizations.of(context).saveFailed)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final progress = ref.watch(progressProvider).value ?? const {};
    final done = progress[widget.slug]?.contains(widget.lessonId) ?? false;
    final next = widget.next;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
        child: Row(
          children: [
            Expanded(
              child: done
                  ? OutlinedButton.icon(
                      onPressed: _busy ? null : () => _toggle(false),
                      icon: const Icon(Icons.check_circle),
                      label: Text(t.completed),
                    )
                  : FilledButton.icon(
                      onPressed: _busy ? null : () => _toggle(true),
                      icon: const Icon(Icons.check),
                      label: Text(t.markDone),
                    ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: next != null
                  ? FilledButton.tonalIcon(
                      onPressed: () async {
                        // Lanjut = sekaligus menandai pelajaran ini selesai.
                        if (!done) await _toggle(true);
                        if (context.mounted) {
                          context.pushReplacement('/courses/${widget.slug}/$next');
                        }
                      },
                      icon: const Icon(Icons.arrow_forward),
                      label: Text(t.next, overflow: TextOverflow.ellipsis),
                    )
                  : FilledButton.tonalIcon(
                      onPressed: () async {
                        if (!done) await _toggle(true);
                        if (context.mounted) context.pop();
                      },
                      icon: const Icon(Icons.flag),
                      label: Text(t.finishedCourse, overflow: TextOverflow.ellipsis),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MaterialTile extends ConsumerStatefulWidget {
  const _MaterialTile({required this.material});

  final LessonMaterial material;

  @override
  ConsumerState<_MaterialTile> createState() => _MaterialTileState();
}

class _MaterialTileState extends ConsumerState<_MaterialTile> {
  bool _busy = false;

  Future<void> _open() async {
    setState(() => _busy = true);
    var ok = false;
    try {
      final url = await ref.read(lessonRepositoryProvider).materialUrl(widget.material.path);
      ok = await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
    } catch (_) {
      ok = false;
    }
    if (!mounted) return;
    setState(() => _busy = false);
    if (!ok) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(AppLocalizations.of(context).downloadFailed)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final m = widget.material;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: const Icon(Icons.description_outlined),
        title: Text(m.title),
        subtitle: m.size > 0 ? Text(formatBytes(m.size)) : null,
        trailing: _busy
            ? const SizedBox.square(dimension: 20, child: CircularProgressIndicator(strokeWidth: 2))
            : const Icon(Icons.open_in_new),
        onTap: _busy ? null : _open,
      ),
    );
  }
}

class _Locked extends ConsumerWidget {
  const _Locked({required this.slug});

  final String slug;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final locale = ref.watch(localeProvider).languageCode;
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.lock_outline, size: 48, color: theme.colorScheme.primary),
            const SizedBox(height: 16),
            Text(t.lockedTitle, style: theme.textTheme.titleLarge, textAlign: TextAlign.center),
            const SizedBox(height: 8),
            Text(t.lockedText, textAlign: TextAlign.center),
            const SizedBox(height: 24),
            OutlinedButton.icon(
              onPressed: () => launchUrl(
                Uri.parse('${Env.siteUrl}/$locale/courses/$slug'),
                mode: LaunchMode.externalApplication,
              ),
              icon: const Icon(Icons.open_in_new),
              label: Text(t.openOnWebsite),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoBox extends StatelessWidget {
  const _InfoBox({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return AspectRatio(
      aspectRatio: 16 / 9,
      child: Container(
        decoration: BoxDecoration(
          color: scheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(16),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 40, color: scheme.outline),
            const SizedBox(height: 8),
            Text(text, textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}
