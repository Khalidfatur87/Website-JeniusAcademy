import 'downloads.dart';

/// Web: tidak ada penyimpanan file.
Downloads createDownloads() => _NoDownloads();

class _NoDownloads implements Downloads {
  @override
  bool get supported => false;
  @override
  Future<String?> local(String storagePath) async => null;
  @override
  Future<String> download(String storagePath, Uri signedUrl) =>
      throw UnsupportedError('web');
  @override
  Future<void> delete(String storagePath) async {}
  @override
  Future<void> clearAll() async {}
}
