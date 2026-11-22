import 'dart:typed_data';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:jeniusacademy/core/providers.dart';
import 'package:jeniusacademy/data/parent_repository.dart';
import 'package:jeniusacademy/data/profile_repository.dart';
import 'package:jeniusacademy/data/quiz_repository.dart';
import 'package:jeniusacademy/domain/profile.dart';
import 'package:jeniusacademy/features/profile/profile_screen.dart';
import 'package:jeniusacademy/l10n/app_localizations.dart';
import 'package:material_ui/material_ui.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Profil di memori, dengan aturan validasi yang sama seperti versi Supabase.
class _MemoryProfile implements ProfileRepository {
  String name = 'Rina';
  int goal = 5;
  bool show = true;
  (int, String)? uploaded;

  @override
  Future<Profile?> load() async =>
      Profile(name: name, avatarUrl: null, weeklyGoal: goal, showOnLeaderboard: show);

  @override
  Future<void> updateName(String n) async {
    final (clean, error) = cleanName(n);
    if (error != null) throw ProfileException(error);
    name = clean;
  }

  @override
  Future<void> updateWeeklyGoal(int g) async => goal = clampGoal(g);

  @override
  Future<void> setShowOnLeaderboard(bool s) async => show = s;

  @override
  Future<void> uploadAvatar(Uint8List bytes, String mimeType) async => uploaded = (bytes.length, mimeType);

  @override
  Future<void> removeAvatar() async {}
}

Future<_MemoryProfile> _pump(WidgetTester tester, {SharedPreferences? prefs}) async {
  final repo = _MemoryProfile();
  await tester.pumpWidget(ProviderScope(
    overrides: [
      currentUserProvider.overrideWith((ref) => Stream.value(null)),
      profileRepositoryProvider.overrideWithValue(repo),
      certificatesProvider.overrideWith((ref) async => const []),
      myParentsProvider.overrideWith((ref) async => const <LinkedParent>[]),
      avatarPickerProvider.overrideWithValue(() async => (Uint8List(1000), 'image/jpeg')),
      preferencesProvider.overrideWithValue(prefs),
    ],
    child: Consumer(
      builder: (context, ref, _) => MaterialApp(
        locale: ref.watch(localeProvider),
        localizationsDelegates: [AppLocalizations.delegate, ...GlobalMaterialLocalizations.delegates],
        supportedLocales: AppLocalizations.supportedLocales,
        home: const ProfileScreen(),
      ),
    ),
  ));
  await tester.pumpAndSettle();
  return repo;
}

void main() {
  testWidgets('mengubah nama; nama kosong ditolak', (tester) async {
    final repo = await _pump(tester);
    expect(find.text('Rina'), findsOneWidget);

    await tester.tap(find.byTooltip('Ubah nama'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField), '  Rina   Putri ');
    await tester.tap(find.text('Simpan'));
    await tester.pumpAndSettle();
    expect(repo.name, 'Rina Putri');
    expect(find.text('Rina Putri'), findsOneWidget);

    await tester.tap(find.byTooltip('Ubah nama'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField), '   ');
    await tester.tap(find.text('Simpan'));
    await tester.pumpAndSettle();
    expect(repo.name, 'Rina Putri');
    expect(find.text('Nama wajib diisi.'), findsOneWidget);
  });

  testWidgets('target mingguan, peringkat, dan foto', (tester) async {
    final repo = await _pump(tester);
    expect(find.text('5 pelajaran per minggu'), findsOneWidget);
    await tester.tap(find.byIcon(Icons.add));
    await tester.pumpAndSettle();
    expect(repo.goal, 6);
    expect(find.text('6 pelajaran per minggu'), findsOneWidget);

    await tester.tap(find.byType(Switch));
    await tester.pumpAndSettle();
    expect(repo.show, isFalse);

    await tester.tap(find.byTooltip('Ganti foto'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Pilih dari galeri'));
    await tester.pumpAndSettle();
    expect(repo.uploaded, (1000, 'image/jpeg'));
  });

  testWidgets('pilihan bahasa disimpan di perangkat', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    await _pump(tester, prefs: prefs);

    await tester.scrollUntilVisible(find.text('English'), 200);
    await tester.tap(find.text('English'));
    await tester.pumpAndSettle();
    expect(prefs.getString('locale'), 'en');
    expect(find.text('Language'), findsOneWidget, reason: 'tampilan langsung berganti bahasa');
  });
}
