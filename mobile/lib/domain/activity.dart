/// Streak harian (fungsi murni), port dari `currentStreak` di `src/lib/activity.ts`.
/// Hari dihitung menurut tanggal lokal; hari ini belum aktif tapi kemarin aktif = belum putus.
int currentStreak(Iterable<DateTime> days, DateTime now) {
  String key(DateTime d) => '${d.year}-${d.month}-${d.day}';
  final set = {for (final d in days) key(d)};
  var cursor = DateTime(now.year, now.month, now.day);
  if (!set.contains(key(cursor))) cursor = cursor.subtract(const Duration(days: 1));
  var streak = 0;
  while (set.contains(key(cursor))) {
    streak++;
    cursor = DateTime(cursor.year, cursor.month, cursor.day - 1);
  }
  return streak;
}
