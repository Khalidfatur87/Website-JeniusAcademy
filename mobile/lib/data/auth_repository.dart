import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/env.dart';
import '../core/providers.dart';
import '../core/push.dart';
import 'downloads.dart';

/// Jenis kegagalan login/daftar, sama dengan `AuthFailure` di src/lib/auth.ts.
enum AuthFailure {
  invalidCredentials,
  emailNotConfirmed,
  alreadyRegistered,
  weakPassword,
  rateLimited,
  generic,
}

class AuthResult {
  const AuthResult({this.error, this.needsConfirmation = false});

  final AuthFailure? error;
  final bool needsConfirmation;
}

AuthFailure mapAuthError(AuthException e) => switch (e.code) {
  'invalid_credentials' => AuthFailure.invalidCredentials,
  'email_not_confirmed' => AuthFailure.emailNotConfirmed,
  'user_already_exists' || 'email_exists' => AuthFailure.alreadyRegistered,
  'weak_password' => AuthFailure.weakPassword,
  'over_request_rate_limit' ||
  'over_email_send_rate_limit' => AuthFailure.rateLimited,
  _ => AuthFailure.generic,
};

class AuthRepository {
  AuthRepository(this._client);

  final SupabaseClient _client;

  GoTrueClient get _auth => _client.auth;

  /// Tautan di email (konfirmasi, reset sandi) dibuka di website, memakai
  /// route callback yang sudah ada: /{locale}/auth/callback?next=...
  String _callback(String locale, String next) =>
      '${Env.siteUrl}/$locale/auth/callback?next=${Uri.encodeComponent(next)}';

  Future<AuthResult> _guard(Future<AuthResult> Function() run) async {
    try {
      return await run();
    } on AuthException catch (e) {
      return AuthResult(error: mapAuthError(e));
    } catch (_) {
      return const AuthResult(error: AuthFailure.generic);
    }
  }

  Future<AuthResult> signIn(String email, String password) => _guard(() async {
    await _auth.signInWithPassword(email: email, password: password);
    return const AuthResult();
  });

  Future<AuthResult> signUp({
    required String name,
    required String email,
    required String password,
    required String locale,
  }) => _guard(() async {
    final res = await _auth.signUp(
      email: email,
      password: password,
      data: {'name': name},
      emailRedirectTo: _callback(locale, '/$locale/courses'),
    );
    // Email sudah terdaftar: Supabase tidak mengembalikan galat, identities kosong.
    if (res.user != null && (res.user!.identities?.isEmpty ?? false)) {
      return const AuthResult(error: AuthFailure.alreadyRegistered);
    }
    return AuthResult(needsConfirmation: res.session == null);
  });

  Future<AuthResult> sendPasswordReset(String email, String locale) =>
      _guard(() async {
        await _auth.resetPasswordForEmail(
          email,
          redirectTo: _callback(locale, '/$locale/reset-password'),
        );
        return const AuthResult();
      });

  Future<void> signOut() => _auth.signOut();
}

final authRepositoryProvider = Provider(
  (ref) => AuthRepository(ref.watch(supabaseProvider)),
);

/// Keluar dari akun: hapus token push perangkat ini dulu (butuh sesi), keluar,
/// lalu hapus data offline (catatan pelajaran, progres, antrean, unduhan) agar
/// akun lain di perangkat yang sama tidak bisa membacanya.
final signOutProvider = Provider<Future<void> Function()>(
  (ref) => () async {
    await ref.read(pushControllerProvider)?.beforeSignOut();
    await ref.read(authRepositoryProvider).signOut();
    final prefs = ref.read(preferencesProvider);
    if (prefs != null) {
      for (final k in prefs.getKeys().toList()) {
        if (k.startsWith('cache.') ||
            k.startsWith('progress.') ||
            k.startsWith('download.')) {
          await prefs.remove(k);
        }
      }
    }
    await ref.read(downloadsProvider).clearAll();
  },
);
