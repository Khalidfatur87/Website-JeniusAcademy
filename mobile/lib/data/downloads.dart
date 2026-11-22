import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'downloads_stub.dart' if (dart.library.io) 'downloads_io.dart' as impl;

/// Materi yang diunduh untuk dibuka offline. Di Android/iOS disimpan di folder
/// pribadi aplikasi (tidak terlihat aplikasi lain, dihapus saat keluar akun).
/// Di web (mode demo) tidak tersedia.
abstract class Downloads {
  bool get supported;

  /// Path file lokal bila sudah diunduh, selain itu null.
  Future<String?> local(String storagePath);

  /// Unduh dari tautan sementara lalu simpan; hasilnya path file lokal.
  Future<String> download(String storagePath, Uri signedUrl);

  Future<void> delete(String storagePath);
  Future<void> clearAll();

  /// Nama file aman dari path storage ("mat/kuadrat/1.pdf" → "mat_kuadrat_1.pdf").
  static String fileName(String storagePath) =>
      storagePath.replaceAll(RegExp(r'[^A-Za-z0-9._-]'), '_');
}

final downloadsProvider = Provider<Downloads>((ref) => impl.createDownloads());

final downloadedFileProvider = FutureProvider.family<String?, String>(
  (ref, path) => ref.watch(downloadsProvider).local(path),
);
