import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'config.dart';
import 'services.dart';

/// Diisi di main() setelah initServices().
final servicesProvider = Provider<Services>((ref) => throw UnimplementedError());

final supabaseProvider = Provider<SupabaseClient>((ref) => Supabase.instance.client);

/// Pengguna yang sedang login (null = belum login). Ikut berubah saat login/keluar.
final currentUserProvider = StreamProvider<User?>((ref) async* {
  final auth = ref.watch(supabaseProvider).auth;
  yield auth.currentUser;
  await for (final s in auth.onAuthStateChange) {
    yield s.session?.user;
  }
});

/// Penyimpanan kecil di perangkat (pilihan bahasa). Diisi di main();
/// null di tes & mode demo, sehingga pilihan hanya berlaku selama aplikasi terbuka.
final preferencesProvider = Provider<SharedPreferences?>((ref) => null);

const _localeKey = 'locale';

class LocaleNotifier extends Notifier<Locale> {
  @override
  Locale build() {
    final saved = ref.watch(preferencesProvider)?.getString(_localeKey);
    return AppConfig.locales.firstWhere(
      (l) => l.languageCode == saved,
      orElse: () => AppConfig.defaultLocale,
    );
  }

  void set(Locale locale) {
    state = locale;
    ref.read(preferencesProvider)?.setString(_localeKey, locale.languageCode);
  }
}

final localeProvider = NotifierProvider<LocaleNotifier, Locale>(LocaleNotifier.new);

/// Jam saat ini (diganti di tes untuk timer try-out & jadwal).
final clockProvider = Provider<DateTime Function()>((ref) => DateTime.now);
