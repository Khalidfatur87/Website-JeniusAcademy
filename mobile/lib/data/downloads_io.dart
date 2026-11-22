import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:path_provider/path_provider.dart';

import 'downloads.dart';

Downloads createDownloads() => FileDownloads();

class FileDownloads implements Downloads {
  FileDownloads({Future<Directory> Function()? baseDir, http.Client? client})
    : _baseDir = baseDir ?? getApplicationSupportDirectory,
      _http = client ?? http.Client();

  final Future<Directory> Function() _baseDir;
  final http.Client _http;

  @override
  bool get supported => true;

  Future<File> _file(String storagePath) async => File(
    '${(await _baseDir()).path}/materials/${Downloads.fileName(storagePath)}',
  );

  @override
  Future<String?> local(String storagePath) async {
    final f = await _file(storagePath);
    return await f.exists() ? f.path : null;
  }

  /// Ditulis ke file sementara dulu, agar file setengah jadi tidak dianggap selesai.
  @override
  Future<String> download(String storagePath, Uri signedUrl) async {
    final res = await _http.get(signedUrl);
    if (res.statusCode != 200) {
      throw HttpException('download ${res.statusCode}');
    }
    final f = await _file(storagePath);
    await f.parent.create(recursive: true);
    final tmp = File('${f.path}.part');
    await tmp.writeAsBytes(res.bodyBytes, flush: true);
    return (await tmp.rename(f.path)).path;
  }

  @override
  Future<void> delete(String storagePath) async {
    final f = await _file(storagePath);
    if (await f.exists()) await f.delete();
  }

  @override
  Future<void> clearAll() async {
    try {
      final d = Directory('${(await _baseDir()).path}/materials');
      if (await d.exists()) await d.delete(recursive: true);
    } catch (_) {}
  }
}
