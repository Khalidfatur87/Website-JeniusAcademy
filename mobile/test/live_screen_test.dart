import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:jeniusacademy/core/providers.dart';
import 'package:jeniusacademy/data/live_repository.dart';
import 'package:jeniusacademy/features/lesson/lesson_screen.dart';
import 'package:jeniusacademy/features/live/live_screen.dart';
import 'package:jeniusacademy/l10n/app_localizations.dart';
import 'package:material_ui/material_ui.dart';

final _start = DateTime.utc(2026, 11, 22, 12);
final _session = LiveSession(
  id: 'l1',
  levelId: 'utbk',
  title: const {'id': 'Bedah Soal UTBK'},
  description: const {'id': ''},
  startsAt: _start,
  minutes: 60,
  hostName: 'Kak Raka',
);

Widget _app(DateTime now, LiveAccess access) => ProviderScope(
  overrides: [
    currentUserProvider.overrideWith((ref) => Stream.value(null)),
    clockProvider.overrideWithValue(() => now),
    liveSessionsProvider.overrideWith((ref) async => [_session]),
    liveAccessProvider.overrideWith((ref, id) async => access),
    videoViewProvider.overrideWithValue((id) => Text('VIDEO $id')),
  ],
  child: MaterialApp(
    locale: const Locale('id'),
    localizationsDelegates: [
      AppLocalizations.delegate,
      ...GlobalMaterialLocalizations.delegates,
    ],
    supportedLocales: AppLocalizations.supportedLocales,
    home: const LiveDetailScreen(id: 'l1'),
  ),
);

void main() {
  testWidgets('sebelum dibuka: belum ada tombol masuk', (tester) async {
    await tester.pumpWidget(
      _app(
        _start.subtract(const Duration(hours: 2)),
        const LiveAccess(access: true),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Akan datang'), findsOneWidget);
    expect(
      find.text('Tombol masuk muncul 15 menit sebelum kelas dimulai.'),
      findsOneWidget,
    );
    expect(find.text('Tambah ke kalender'), findsOneWidget);
  });

  testWidgets('sedang berlangsung: tombol masuk dari server', (tester) async {
    await tester.pumpWidget(
      _app(
        _start.add(const Duration(minutes: 5)),
        const LiveAccess(access: true, joinUrl: 'https://meet.example.com/x'),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Sedang berlangsung'), findsOneWidget);
    expect(find.text('Masuk kelas live'), findsOneWidget);
  });

  testWidgets('selesai: rekaman', (tester) async {
    await tester.pumpWidget(
      _app(
        _start.add(const Duration(hours: 3)),
        const LiveAccess(access: true, recordingYoutubeId: 'rec1'),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('VIDEO rec1'), findsOneWidget);
  });

  testWidgets('tanpa akses: terkunci', (tester) async {
    await tester.pumpWidget(
      _app(
        _start.add(const Duration(minutes: 5)),
        const LiveAccess(access: false),
      ),
    );
    await tester.pumpAndSettle();
    expect(
      find.text('Kelas live ini khusus pelanggan paket jenjangnya.'),
      findsOneWidget,
    );
    expect(find.text('Masuk kelas live'), findsNothing);
  });
}
