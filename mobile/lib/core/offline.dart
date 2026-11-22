import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' show ClientException;
import 'package:shared_preferences/shared_preferences.dart';

import 'providers.dart';

/// Galat karena tidak ada koneksi (bukan karena server menolak).
bool isNetworkError(Object e) =>
    e is ClientException ||
    e is TimeoutException ||
    e.toString().contains('SocketException') ||
    e.toString().contains('Failed host lookup') ||
    e.toString().contains('AuthRetryableFetchException');

/// Sedang menampilkan data tersimpan karena offline?
class OfflineNotifier extends Notifier<bool> {
  @override
  bool build() => false;

  void set(bool value) {
    if (state != value) state = value;
  }
}

final offlineProvider = NotifierProvider<OfflineNotifier, bool>(OfflineNotifier.new);

/// Cache JSON sederhana di perangkat untuk dibaca saat offline.
class OfflineCache {
  OfflineCache(this._prefs, this._offline);

  final SharedPreferences? _prefs;
  final void Function(bool) _offline;

  /// Ambil dari server dan simpan; jika tidak ada koneksi, pakai salinan terakhir.
  Future<T> read<T>(String key, Future<T> Function() fetch) async {
    final k = 'cache.$key';
    try {
      final value = await fetch();
      _offline(false);
      try {
        await _prefs?.setString(k, jsonEncode(value));
      } catch (_) {
        // Nilai yang tidak bisa dijadikan JSON tidak disimpan.
      }
      return value;
    } catch (e) {
      final saved = _prefs?.getString(k);
      if (!isNetworkError(e) || saved == null) rethrow;
      _offline(true);
      return jsonDecode(saved) as T;
    }
  }
}

final offlineCacheProvider = Provider(
  (ref) => OfflineCache(
    ref.watch(preferencesProvider),
    (v) => Future.microtask(() => ref.read(offlineProvider.notifier).set(v)),
  ),
);
