/// KELAS LIVE (fungsi murni), port dari `src/lib/live.ts`.
library;

enum LivePhase { upcoming, soon, live, ended }

/// "soon" = 15 menit sebelum mulai (saat server mulai memberikan link masuk).
LivePhase livePhase(DateTime startsAt, int minutes, DateTime now) {
  final end = startsAt.add(Duration(minutes: minutes));
  if (!now.isBefore(end)) return LivePhase.ended;
  if (!now.isBefore(startsAt)) return LivePhase.live;
  if (!now.isBefore(startsAt.subtract(const Duration(minutes: 15)))) return LivePhase.soon;
  return LivePhase.upcoming;
}

String _gcalDate(DateTime d) =>
    d.toUtc().toIso8601String().replaceAll(RegExp(r'[-:]'), '').replaceAll(RegExp(r'\.\d+'), '');

/// Tautan "tambah ke Google Calendar" (aplikasi Kalender atau browser).
Uri googleCalendarUrl({
  required String title,
  required String details,
  required DateTime startsAt,
  required int minutes,
}) =>
    Uri.https('calendar.google.com', '/calendar/render', {
      'action': 'TEMPLATE',
      'text': title,
      'details': details,
      'dates': '${_gcalDate(startsAt)}/${_gcalDate(startsAt.add(Duration(minutes: minutes)))}',
    });
