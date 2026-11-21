import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:jeniusacademy/core/push.dart';

class _FakeMessaging implements PushMessaging {
  bool allow = true;
  String? token = 'token-1';
  final refresh = StreamController<String>.broadcast();

  @override
  Future<bool> requestPermission() async => allow;
  @override
  Future<String?> getToken() async => token;
  @override
  Stream<String> get onTokenRefresh => refresh.stream;
  @override
  Stream<String> get openedRoutes => const Stream.empty();
  @override
  Future<String?> initialRoute() async => null;
}

class _FakeTokens implements DeviceTokenRepository {
  final saved = <String>{};
  bool fail = false;

  @override
  Future<void> register(String token, String platform) async {
    if (fail) throw Exception('offline');
    saved.add(token);
  }

  @override
  Future<void> unregister(String token) async => saved.remove(token);
}

void main() {
  test('login mendaftarkan token; token baru ikut didaftarkan; keluar menghapus', () async {
    final m = _FakeMessaging();
    final repo = _FakeTokens();
    final c = PushController(m, repo);

    await c.onSignedIn();
    expect(repo.saved, {'token-1'});

    m.refresh.add('token-2');
    await Future<void>.delayed(Duration.zero);
    expect(repo.saved, {'token-1', 'token-2'});

    await c.beforeSignOut();
    expect(repo.saved, {'token-1'}, reason: 'token terakhir perangkat ini dihapus');
  });

  test('izin ditolak: tidak ada yang didaftarkan', () async {
    final m = _FakeMessaging()..allow = false;
    final repo = _FakeTokens();
    await PushController(m, repo).onSignedIn();
    expect(repo.saved, isEmpty);
  });

  test('gagal mendaftar tidak melempar error ke aplikasi', () async {
    final repo = _FakeTokens()..fail = true;
    await PushController(_FakeMessaging(), repo).onSignedIn();
    expect(repo.saved, isEmpty);
  });
}
