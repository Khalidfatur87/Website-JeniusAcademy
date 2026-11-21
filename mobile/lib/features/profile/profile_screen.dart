import 'dart:typed_data';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/config.dart';
import '../../core/providers.dart';
import '../../data/auth_repository.dart';
import '../../data/profile_repository.dart';
import '../../data/quiz_repository.dart';
import '../../domain/l10n_text.dart';
import '../../domain/profile.dart';
import '../../l10n/app_localizations.dart';
import '../../widgets/async_view.dart';

/// Memilih foto dari galeri; diperkecil ke 512 px agar jauh di bawah batas 2 MB.
/// Diganti di tes.
final avatarPickerProvider = Provider<Future<(Uint8List, String)?> Function()>(
  (ref) => () async {
    final file = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      maxWidth: 512,
      maxHeight: 512,
      imageQuality: 85,
    );
    if (file == null) return null;
    return (await file.readAsBytes(), file.mimeType ?? mimeFromName(file.name));
  },
);

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool _busy = false;

  String _errorText(AppLocalizations t, Object e) => switch (e) {
        ProfileException(error: ProfileError.nameRequired) => t.errNameRequired,
        ProfileException(error: ProfileError.nameTooLong) => t.errNameTooLong,
        ProfileException(error: ProfileError.fileType) => t.errFileType,
        ProfileException(error: ProfileError.fileSize) => t.errFileSize,
        _ => t.saveFailed,
      };

  /// Jalankan perubahan, muat ulang profil, beri tahu hasilnya.
  Future<void> _run(Future<void> Function(ProfileRepository repo) action) async {
    final t = AppLocalizations.of(context);
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _busy = true);
    messenger.hideCurrentSnackBar(); // pesan baru langsung menggantikan yang lama
    try {
      await action(ref.read(profileRepositoryProvider));
      ref.invalidate(profileProvider);
      messenger.showSnackBar(SnackBar(content: Text(t.saved)));
    } catch (e) {
      messenger.showSnackBar(SnackBar(content: Text(_errorText(t, e))));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _editName(String? current) async {
    final name = await showDialog<String>(
      context: context,
      builder: (_) => _NameDialog(initial: current ?? ''),
    );
    if (name != null) await _run((repo) => repo.updateName(name));
  }

  Future<void> _editPhoto(bool hasPhoto) async {
    final t = AppLocalizations.of(context);
    final choice = await showModalBottomSheet<String>(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library_outlined),
              title: Text(t.choosePhoto),
              onTap: () => Navigator.pop(context, 'pick'),
            ),
            if (hasPhoto)
              ListTile(
                leading: const Icon(Icons.delete_outline),
                title: Text(t.removePhoto),
                onTap: () => Navigator.pop(context, 'remove'),
              ),
          ],
        ),
      ),
    );
    if (choice == 'remove') return _run((repo) => repo.removeAvatar());
    if (choice != 'pick') return;
    final picked = await ref.read(avatarPickerProvider)();
    if (picked == null) return;
    await _run((repo) => repo.uploadAvatar(picked.$1, picked.$2));
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final theme = Theme.of(context);
    final user = ref.watch(currentUserProvider).value;
    final profile = ref.watch(profileProvider);
    final locale = ref.watch(localeProvider);

    return Scaffold(
      appBar: AppBar(title: Text(t.tabProfile)),
      body: AsyncView(
        value: profile,
        onRetry: () => ref.invalidate(profileProvider),
        builder: (p) {
          final name = p?.name;
          final initial = (name ?? user?.email ?? '?').trim().characters.firstOrNull ?? '?';
          return AbsorbPointer(
            absorbing: _busy,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (_busy) const LinearProgressIndicator(),
                Center(
                  child: Stack(
                    clipBehavior: Clip.none, // tombol kamera sedikit keluar dari lingkaran
                    children: [
                      CircleAvatar(
                        radius: 44,
                        backgroundImage: p?.avatarUrl == null ? null : NetworkImage(p!.avatarUrl!),
                        child: p?.avatarUrl == null
                            ? Text(initial.toUpperCase(), style: theme.textTheme.headlineMedium)
                            : null,
                      ),
                      Positioned(
                        right: -4,
                        bottom: -4,
                        child: IconButton.filledTonal(
                          tooltip: t.changePhoto,
                          onPressed: () => _editPhoto(p?.avatarUrl != null),
                          icon: const Icon(Icons.photo_camera_outlined, size: 20),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Flexible(
                      child: Text(
                        name ?? '-',
                        style: theme.textTheme.titleLarge,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    IconButton(
                      tooltip: t.editName,
                      onPressed: () => _editName(name),
                      icon: const Icon(Icons.edit_outlined, size: 20),
                    ),
                  ],
                ),
                if (user?.email != null)
                  Text(user!.email!, textAlign: TextAlign.center, style: theme.textTheme.bodySmall),
                const Divider(height: 32),
                if (p != null) ...[
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(t.weeklyGoal),
                    subtitle: Text(t.weeklyGoalValue(p.weeklyGoal)),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton.outlined(
                          onPressed: p.weeklyGoal <= 1
                              ? null
                              : () => _run((r) => r.updateWeeklyGoal(p.weeklyGoal - 1)),
                          icon: const Icon(Icons.remove),
                        ),
                        SizedBox(
                          width: 32,
                          child: Text('${p.weeklyGoal}', textAlign: TextAlign.center),
                        ),
                        IconButton.outlined(
                          onPressed: p.weeklyGoal >= 50
                              ? null
                              : () => _run((r) => r.updateWeeklyGoal(p.weeklyGoal + 1)),
                          icon: const Icon(Icons.add),
                        ),
                      ],
                    ),
                  ),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(t.showOnLeaderboard),
                    subtitle: Text(t.showOnLeaderboardHint),
                    value: p.showOnLeaderboard,
                    onChanged: (v) => _run((r) => r.setShowOnLeaderboard(v)),
                  ),
                  const Divider(height: 32),
                ],
                Text(t.myCertificates, style: theme.textTheme.titleSmall),
                const SizedBox(height: 4),
                ...switch (ref.watch(certificatesProvider).value) {
                  null => const <Widget>[],
                  final list when list.isEmpty => [
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        child: Text(t.noCertificates, style: theme.textTheme.bodySmall),
                      ),
                    ],
                  final list => [
                      for (final c in list)
                        ListTile(
                          contentPadding: EdgeInsets.zero,
                          leading: const Icon(Icons.workspace_premium_outlined),
                          title: Text(pickText(c.courseTitle, locale.languageCode)),
                          subtitle: Text(c.code),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () => context.push('/certificates/${c.code}'),
                        ),
                    ],
                },
                const Divider(height: 32),
                Text(t.language, style: theme.textTheme.titleSmall),
                const SizedBox(height: 8),
                SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(value: 'id', label: Text('Bahasa Indonesia')),
                    ButtonSegment(value: 'en', label: Text('English')),
                  ],
                  selected: {locale.languageCode},
                  onSelectionChanged: (s) => ref.read(localeProvider.notifier).set(Locale(s.first)),
                ),
                const Divider(height: 32),
                OutlinedButton.icon(
                  onPressed: () => ref.read(authRepositoryProvider).signOut(),
                  icon: const Icon(Icons.logout),
                  label: Text(t.logout),
                ),
                const SizedBox(height: 24),
                Center(child: Text(AppConfig.name, style: theme.textTheme.bodySmall)),
              ],
            ),
          );
        },
      ),
    );
  }
}

/// Dialog ubah nama. Controller dimiliki dialog dan baru dibuang setelah
/// animasi tutup selesai (membuangnya lebih awal membuat TextField error).
class _NameDialog extends StatefulWidget {
  const _NameDialog({required this.initial});

  final String initial;

  @override
  State<_NameDialog> createState() => _NameDialogState();
}

class _NameDialogState extends State<_NameDialog> {
  late final _controller = TextEditingController(text: widget.initial);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return AlertDialog(
      title: Text(t.editName),
      content: TextField(
        controller: _controller,
        autofocus: true,
        maxLength: nameMax,
        textCapitalization: TextCapitalization.words,
        decoration: InputDecoration(labelText: t.name),
        onSubmitted: (v) => Navigator.pop(context, v),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: Text(t.cancel)),
        FilledButton(onPressed: () => Navigator.pop(context, _controller.text), child: Text(t.save)),
      ],
    );
  }
}
