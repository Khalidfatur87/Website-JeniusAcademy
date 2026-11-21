import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';
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

class LocaleNotifier extends Notifier<Locale> {
  @override
  Locale build() => AppConfig.defaultLocale;

  void set(Locale locale) => state = locale;
}

final localeProvider = NotifierProvider<LocaleNotifier, Locale>(LocaleNotifier.new);
