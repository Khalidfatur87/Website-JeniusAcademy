import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';
import 'package:open_filex/open_filex.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/env.dart';
import '../../core/providers.dart';
import '../../data/course_repository.dart';
import '../../data/downloads.dart';
import '../../data/lesson_repository.dart';
import '../../data/tutor_repository.dart';
import '../../domain/course_progress.dart';
import '../../domain/l10n_text.dart';
import '../../l10n/app_localizations.dart';
import '../../widgets/async_view.dart';
import '../tutor/tutor_sheet.dart';
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
              const SizedBox(height: 16),
              if (ref.watch(tutorEnabledProvider))
                Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: const Icon(Icons.auto_awesome),
                    title: Text(t.tutorTitle),
                    subtitle: Text(t.tutorSubtitle),
                    onTap: () => TutorSheet.show(context, slug: slug, lessonId: lessonId),
                  ),
                ),
              Card(
                margin: EdgeInsets.zero,
                child: ListTile(
                  leading: const Icon(Icons.forum_outlined),
                  title: Text(t.discussionOpen),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => context.push('/courses/$slug/$lessonId/discussion'),
                ),
              ),
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

  void _fail() {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(AppLocalizations.of(context).downloadFailed)));
  }

  /// Sudah diunduh → buka file lokal (offline). Belum → unduh (bila didukung)
  /// lalu buka; di web dibuka langsung di browser.
  Future<void> _open() async {
    final m = widget.material;
    final downloads = ref.read(downloadsProvider);
    setState(() => _busy = true);
    try {
      final local = await downloads.local(m.path);
      if (local != null) {
        if ((await OpenFilex.open(local)).type != ResultType.done) _fail();
        return;
      }
      final url = Uri.parse(await ref.read(lessonRepositoryProvider).materialUrl(m.path));
      if (!downloads.supported) {
        if (!await launchUrl(url, mode: LaunchMode.externalApplication)) _fail();
        return;
      }
      final path = await downloads.download(m.path, url);
      ref.invalidate(downloadedFileProvider(m.path));
      if ((await OpenFilex.open(path)).type != ResultType.done) _fail();
    } catch (_) {
      _fail();
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _delete() async {
    await ref.read(downloadsProvider).delete(widget.material.path);
    ref.invalidate(downloadedFileProvider(widget.material.path));
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final m = widget.material;
    final downloaded = ref.watch(downloadedFileProvider(m.path)).value != null;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(downloaded ? Icons.offline_pin : Icons.description_outlined),
        title: Text(m.title),
        subtitle: Text([if (m.size > 0) formatBytes(m.size), if (downloaded) t.availableOffline].join(' · ')),
        trailing: _busy
            ? const SizedBox.square(dimension: 20, child: CircularProgressIndicator(strokeWidth: 2))
            : downloaded
                ? IconButton(tooltip: t.removeDownload, onPressed: _delete, icon: const Icon(Icons.delete_outline))
                : Icon(ref.watch(downloadsProvider).supported ? Icons.download : Icons.open_in_new),
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
