/// Progres kelas (fungsi murni).
library;

/// Persen pelajaran selesai, dibulatkan (0–100).
int coursePercent(int done, int total) =>
    total <= 0 ? 0 : (done.clamp(0, total) / total * 100).round();

/// Pelajaran sebelum & sesudah [current] dalam urutan [ids].
({String? previous, String? next}) lessonNeighbors(List<String> ids, String current) {
  final i = ids.indexOf(current);
  if (i < 0) return (previous: null, next: null);
  return (
    previous: i > 0 ? ids[i - 1] : null,
    next: i < ids.length - 1 ? ids[i + 1] : null,
  );
}

/// Pelajaran yang dibuka tombol "Mulai/Lanjutkan belajar":
/// yang pertama belum selesai; jika semua selesai, pelajaran pertama.
String? resumeLesson(List<String> ids, Set<String> done) {
  if (ids.isEmpty) return null;
  return ids.firstWhere((id) => !done.contains(id), orElse: () => ids.first);
}

/// Ukuran file yang mudah dibaca: 820 B, 12 KB, 3,4 MB.
String formatBytes(int bytes) {
  if (bytes < 1024) return '$bytes B';
  if (bytes < 1024 * 1024) return '${(bytes / 1024).round()} KB';
  final mb = bytes / (1024 * 1024);
  return '${mb.toStringAsFixed(1).replaceAll('.', ',')} MB';
}
