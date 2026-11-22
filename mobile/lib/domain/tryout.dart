/// TRY-OUT UTBK (fungsi murni), port dari `src/lib/tryout.ts`.
/// Tes memakai shared/fixtures/tryout.json (sama dengan website).
library;

enum TryoutWindow { upcoming, open, closed }

TryoutWindow tryoutWindow(DateTime? opensAt, DateTime? closesAt, DateTime now) {
  if (opensAt != null && now.isBefore(opensAt)) return TryoutWindow.upcoming;
  if (closesAt != null && now.isAfter(closesAt)) return TryoutWindow.closed;
  return TryoutWindow.open;
}

int totalMinutes(Iterable<int> minutes) => minutes.fold(0, (s, m) => s + m);

/// Subtes berjalan berurutan seperti UTBK: subtes ke-i berakhir pada
/// mulai + jumlah menit subtes 0..i. [finishedThrough] = indeks subtes terakhir yang
/// diselesaikan lebih awal (sisa waktunya hangus).
/// Hasil: indeks subtes aktif (`minutes.length` = semua selesai) dan detik tersisa.
({int index, int secondsLeft}) currentSection(
  List<int> minutes,
  DateTime startedAt,
  DateTime now, {
  int finishedThrough = -1,
}) {
  var end = startedAt.millisecondsSinceEpoch;
  final t = now.millisecondsSinceEpoch;
  for (var i = 0; i < minutes.length; i++) {
    end += minutes[i] * 60000;
    if (i <= finishedThrough) continue;
    if (t < end) return (index: i, secondsLeft: ((end - t) / 1000).ceil());
  }
  return (index: minutes.length, secondsLeft: 0);
}

/// 309 → "05:09"; di atas satu jam → "1:05:09".
String formatClock(num totalSeconds) {
  final s = totalSeconds < 0 ? 0 : totalSeconds.floor();
  final h = s ~/ 3600;
  final mm = ((s % 3600) ~/ 60).toString().padLeft(2, '0');
  final ss = (s % 60).toString().padLeft(2, '0');
  return h > 0 ? '$h:$mm:$ss' : '$mm:$ss';
}

/// Subtes terlemah (persen terendah) — saran yang dipelajari ulang.
List<({String id, int score, int total, int percent})> weakestSections(
  Iterable<({String id, int score, int total})> scores, {
  int limit = 2,
}) {
  final list = [
    for (final s in scores)
      if (s.total > 0) (id: s.id, score: s.score, total: s.total, percent: (s.score / s.total * 100).round()),
  ]..sort((a, b) => a.percent.compareTo(b.percent));
  return list.take(limit).toList();
}
