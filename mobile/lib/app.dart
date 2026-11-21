import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import 'core/config.dart';
import 'core/providers.dart';
import 'core/push.dart';
import 'core/router.dart';
import 'core/theme.dart';
import 'l10n/app_localizations.dart';

class JeniusApp extends ConsumerStatefulWidget {
  const JeniusApp({super.key});

  @override
  ConsumerState<JeniusApp> createState() => _JeniusAppState();
}

class _JeniusAppState extends ConsumerState<JeniusApp> {
  StreamSubscription<String>? _opened;

  @override
  void initState() {
    super.initState();
    final messaging = ref.read(pushMessagingProvider);
    if (messaging == null || !ref.read(servicesProvider).supabase) return;
    // Notifikasi diketuk → buka halaman tujuannya (mis. /home).
    void open(String route) => ref.read(routerProvider).go(route);
    _opened = messaging.openedRoutes.listen(open);
    messaging.initialRoute().then((r) => r == null ? null : open(r));
  }

  @override
  void dispose() {
    _opened?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ref = this.ref;
    final services = ref.watch(servicesProvider);
    final locale = ref.watch(localeProvider);

    // Delegasi Material/Cupertino dari material_ui (yang di flutter_localizations
    // sudah usang dan tidak lagi memuat terjemahan bahasa Indonesia).
    const delegates = [AppLocalizations.delegate, ...GlobalMaterialLocalizations.delegates];

    // Login (termasuk sesi tersimpan saat aplikasi dibuka) → daftarkan token push.
    ref.listen(currentUserProvider, (prev, next) {
      final was = prev?.value?.id;
      final now = next.value?.id;
      if (now != null && now != was) ref.read(pushControllerProvider)?.onSignedIn();
    });

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
