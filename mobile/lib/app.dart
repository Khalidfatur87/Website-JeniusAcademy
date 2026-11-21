import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import 'core/config.dart';
import 'core/providers.dart';
import 'core/router.dart';
import 'core/theme.dart';
import 'l10n/app_localizations.dart';

class JeniusApp extends ConsumerWidget {
  const JeniusApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final services = ref.watch(servicesProvider);
    final locale = ref.watch(localeProvider);

    // Delegasi Material/Cupertino dari material_ui (yang di flutter_localizations
    // sudah usang dan tidak lagi memuat terjemahan bahasa Indonesia).
    const delegates = [AppLocalizations.delegate, ...GlobalMaterialLocalizations.delegates];

    if (!services.supabase) {
      return MaterialApp(
        title: AppConfig.name,
        theme: buildTheme(Brightness.light),
        locale: locale,
        supportedLocales: AppConfig.locales,
        localizationsDelegates: delegates,
        home: const _NotConfigured(),
      );
    }

    return MaterialApp.router(
      title: AppConfig.name,
      debugShowCheckedModeBanner: false,
      theme: buildTheme(Brightness.light),
      darkTheme: buildTheme(Brightness.dark),
      locale: locale,
      supportedLocales: AppConfig.locales,
      localizationsDelegates: delegates,
      routerConfig: ref.watch(routerProvider),
    );
  }
}

/// Tampil jika env.json belum diisi saat build (khusus pengembang).
class _NotConfigured extends StatelessWidget {
  const _NotConfigured();

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.settings_suggest, size: 48),
              const SizedBox(height: 16),
              Text(t.notConfiguredTitle, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              Text(t.notConfiguredBody, textAlign: TextAlign.center),
            ],
          ),
        ),
      ),
    );
  }
}
