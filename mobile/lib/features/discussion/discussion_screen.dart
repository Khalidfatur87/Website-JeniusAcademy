import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/providers.dart';
import '../../data/discussion_repository.dart';
import '../../l10n/app_localizations.dart';
import '../../widgets/async_view.dart';

/// Tanya jawab per pelajaran: pertanyaan, balasan satu tingkat, label pengajar.
class DiscussionScreen extends ConsumerStatefulWidget {
  const DiscussionScreen({super.key, required this.slug, required this.lessonId});

  final String slug;
  final String lessonId;

  @override
  ConsumerState<DiscussionScreen> createState() => _DiscussionScreenState();
}

class _DiscussionScreenState extends ConsumerState<DiscussionScreen> {
  final _text = TextEditingController();
  final _focus = FocusNode();
  LessonComment? _replyTo;
  bool _busy = false;

  ({String slug, String lessonId}) get _key => (slug: widget.slug, lessonId: widget.lessonId);

  @override
  void dispose() {
    _text.dispose();
    _focus.dispose();
    super.dispose();
  }

  void _snack(String text) => ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(text)));

  Future<void> _send() async {
    final t = AppLocalizations.of(context);
    setState(() => _busy = true);
    try {
      final ok = await ref.read(discussionRepositoryProvider).post(
            widget.slug,
            widget.lessonId,
            _text.text,
            parentId: _replyTo?.id,
          );
      if (!mounted) return;
      if (ok) {
        _text.clear();
        setState(() => _replyTo = null);
        ref.invalidate(commentsProvider(_key));
      } else {
        _snack(t.discussionFailed);
      }
    } catch (_) {
      if (mounted) _snack(t.discussionFailed);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _delete(LessonComment c) async {
    final t = AppLocalizations.of(context);
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        content: Text(t.discussionConfirmDelete),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(t.cancel)),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: Text(t.discussionDelete)),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ref.read(discussionRepositoryProvider).delete(c.id);
      ref.invalidate(commentsProvider(_key));
    } catch (_) {
      if (mounted) _snack(t.discussionFailed);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final comments = ref.watch(commentsProvider(_key));

    return Scaffold(
      appBar: AppBar(title: Text(t.discussionTitle)),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(commentsProvider(_key).future),
        child: AsyncView(
          value: comments,
          onRetry: () => ref.invalidate(commentsProvider(_key)),
          builder: (list) {
            final items = threads(list);
            if (items.isEmpty) {
              return ListView(
                padding: const EdgeInsets.all(32),
                children: [Text(t.discussionEmpty, textAlign: TextAlign.center)],
              );
            }
            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                for (final th in items)
                  Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(12, 12, 12, 4),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _CommentTile(comment: th.question, onDelete: _delete),
                          for (final r in th.replies)
                            Padding(
                              padding: const EdgeInsets.only(left: 40),
                              child: _CommentTile(comment: r, onDelete: _delete),
                            ),
                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton.icon(
                              onPressed: () {
                                setState(() => _replyTo = th.question);
                                _focus.requestFocus();
                              },
                              icon: const Icon(Icons.reply, size: 18),
                              label: Text(t.discussionReply),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            );
          },
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(12, 8, 12, 8 + MediaQuery.viewInsetsOf(context).bottom),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (_replyTo case final r?)
                Row(
                  children: [
                    Expanded(
                      child: Text(t.discussionReplyingTo(r.authorName),
                          style: Theme.of(context).textTheme.bodySmall),
                    ),
                    IconButton(
                      visualDensity: VisualDensity.compact,
                      onPressed: () => setState(() => _replyTo = null),
                      icon: const Icon(Icons.close, size: 18),
                    ),
                  ],
                ),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _text,
                      focusNode: _focus,
                      minLines: 1,
                      maxLines: 4,
                      maxLength: commentMax,
                      buildCounter: (_, {required currentLength, required isFocused, maxLength}) => null,
                      decoration: InputDecoration(
                        hintText: _replyTo == null ? t.discussionAsk : t.discussionReplyHint,
                        isDense: true,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    tooltip: t.send,
                    onPressed: _busy ? null : _send,
                    icon: const Icon(Icons.send),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CommentTile extends ConsumerWidget {
  const _CommentTile({required this.comment, required this.onDelete});

  final LessonComment comment;
  final ValueChanged<LessonComment> onDelete;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final theme = Theme.of(context);
    final c = comment;
    final when = DateFormat.yMMMd(ref.watch(localeProvider).toString()).add_Hm().format(c.createdAt.toLocal());
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 16,
            backgroundImage: c.authorAvatar == null ? null : NetworkImage(c.authorAvatar!),
            child: c.authorAvatar == null ? Text(c.authorName.characters.firstOrNull ?? '?') : null,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: 6,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    Text(c.authorName, style: theme.textTheme.labelLarge),
                    if (c.isStaff)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.secondaryContainer,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(t.discussionTeacher, style: theme.textTheme.labelSmall),
                      ),
                    Text(when, style: theme.textTheme.bodySmall),
                  ],
                ),
                const SizedBox(height: 2),
                Text(c.body),
              ],
            ),
          ),
          if (c.canDelete)
            IconButton(
              tooltip: t.discussionDelete,
              visualDensity: VisualDensity.compact,
              onPressed: () => onDelete(c),
              icon: const Icon(Icons.delete_outline, size: 18),
            ),
        ],
      ),
    );
  }
}
