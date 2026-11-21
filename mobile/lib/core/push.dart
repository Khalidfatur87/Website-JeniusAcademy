import 'dart:async';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'providers.dart';

/// Pembungkus Firebase Messaging (diganti di tes).
abstract class PushMessaging {
  /// Minta izin notifikasi (Android 13+/iOS). true = diizinkan.
  Future<bool> requestPermission();
  Future<String?> getToken();
  Stream<String> get onTokenRefresh;

  /// Rute dari notifikasi yang diketuk (data `route`), termasuk yang membuka aplikasi.
  Stream<String> get openedRoutes;
  Future<String?> initialRoute();
}

/// Memakai token FCM klasik (getToken/onTokenRefresh), yang dikirim server lewat
/// FCM HTTP v1 `message.token` (src/lib/fcm.ts). Kedua API ini ditandai usang di
/// firebase_messaging 17 (diganti register()/onRegistered dengan Installation ID);
/// migrasikan bersama sisi server saat format kirim yang baru sudah dipastikan.
class FirebasePushMessaging implements PushMessaging {
  FirebaseMessaging get _fm => FirebaseMessaging.instance;

  @override
  Future<bool> requestPermission() async {
    final s = await _fm.requestPermission();
    return s.authorizationStatus == AuthorizationStatus.authorized ||
        s.authorizationStatus == AuthorizationStatus.provisional;
  }

  @override
  // ignore: deprecated_member_use
  Future<String?> getToken() => _fm.getToken();

  @override
  // ignore: deprecated_member_use
  Stream<String> get onTokenRefresh => _fm.onTokenRefresh;

  @override
  Stream<String> get openedRoutes => FirebaseMessaging.onMessageOpenedApp
      .map((m) => m.data['route'])
      .where((r) => r is String && r.startsWith('/'))
      .cast<String>();

  @override
  Future<String?> initialRoute() async {
    final route = (await _fm.getInitialMessage())?.data['route'];
    return route is String && route.startsWith('/') ? route : null;
  }
}

/// Token perangkat di database (fungsi register/unregister_device_token).
abstract class DeviceTokenRepository {
  Future<void> register(String token, String platform);
  Future<void> unregister(String token);
}

class SupabaseDeviceTokenRepository implements DeviceTokenRepository {
  SupabaseDeviceTokenRepository(this._client);

  final SupabaseClient _client;

  @override
  Future<void> register(String token, String platform) =>
      _client.rpc('register_device_token', params: {'p_token': token, 'p_platform': platform});

  @override
  Future<void> unregister(String token) =>
      _client.rpc('unregister_device_token', params: {'p_token': token});
}

final pushMessagingProvider = Provider<PushMessaging?>((ref) {
  return ref.watch(servicesProvider).firebase ? FirebasePushMessaging() : null;
});

final deviceTokenRepositoryProvider = Provider<DeviceTokenRepository>(
  (ref) => SupabaseDeviceTokenRepository(ref.watch(supabaseProvider)),
);

String get _platform => defaultTargetPlatform == TargetPlatform.iOS ? 'ios' : 'android';

/// Mendaftarkan token saat login & saat token diperbarui; menghapusnya sebelum keluar.
/// Kegagalan push tidak pernah menghalangi pemakaian aplikasi.
class PushController {
  PushController(this._messaging, this._tokens);

  final PushMessaging _messaging;
  final DeviceTokenRepository _tokens;
  String? _token;
  StreamSubscription<String>? _refresh;

  Future<void> onSignedIn() async {
    try {
      if (!await _messaging.requestPermission()) return;
      final token = await _messaging.getToken();
      if (token == null) return;
      _token = token;
      await _tokens.register(token, _platform);
      _refresh ??= _messaging.onTokenRefresh.listen((t) {
        _token = t;
        _tokens.register(t, _platform).catchError((_) {});
      });
    } catch (e) {
      debugPrint('Push tidak aktif: $e');
    }
  }

  /// Dipanggil SEBELUM keluar, karena menghapus token butuh sesi login.
  Future<void> beforeSignOut() async {
    await _refresh?.cancel();
    _refresh = null;
    final token = _token;
    _token = null;
    if (token == null) return;
    try {
      await _tokens.unregister(token);
    } catch (_) {}
  }
}

final pushControllerProvider = Provider<PushController?>((ref) {
  final messaging = ref.watch(pushMessagingProvider);
  if (messaging == null) return null;
  return PushController(messaging, ref.watch(deviceTokenRepositoryProvider));
});
