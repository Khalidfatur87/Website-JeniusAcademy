import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/config.dart';
import '../../core/providers.dart';
import '../../data/auth_repository.dart';
import '../../data/engagement_repository.dart';
import '../../l10n/app_localizations.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final user = ref.watch(currentUserProvider).value;
    final name = ref.watch(myNameProvider).value;
    final locale = ref.watch(localeProvider);

    return Scaffold(
      appBar: AppBar(title: Text(t.tabProfile)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: CircleAvatar(
              radius: 28,
              child: Text((name ?? user?.email ?? '?').characters.first.toUpperCase()),
            ),
            title: Text(name ?? '-'),
            subtitle: Text(user?.email ?? ''),
          ),
          const Divider(height: 32),
          Text(t.language, style: Theme.of(context).textTheme.titleSmall),
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
          Center(
            child: Text(AppConfig.name, style: Theme.of(context).textTheme.bodySmall),
          ),
        ],
      ),
    );
  }
}
