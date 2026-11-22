import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:jeniusacademy/data/auth_repository.dart';
import 'package:jeniusacademy/features/auth/login_screen.dart';
import 'package:jeniusacademy/l10n/app_localizations.dart';
import 'package:material_ui/material_ui.dart';

class _FakeAuth implements AuthRepository {
  String? usedToken;
  AuthFailure? fail;

  @override
  Future<AuthResult?> signInWithGoogle(Future<String?> Function() idToken) async {
    final token = await idToken();
    if (token == null) return null;
    usedToken = token;
    return AuthResult(error: fail);
  }

  @override
  noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

Widget _app(_FakeAuth auth, Future<String?> Function()? idToken) => ProviderScope(
      overrides: [
        authRepositoryProvider.overrideWithValue(auth),
        googleIdTokenProvider.overrideWithValue(idToken),
      ],
      child: MaterialApp(
        locale: const Locale('id'),
        localizationsDelegates: [AppLocalizations.delegate, ...GlobalMaterialLocalizations.delegates],
        supportedLocales: AppLocalizations.supportedLocales,
        home: const LoginScreen(),
      ),
    );

void main() {
  testWidgets('tanpa Client ID: tombol Google tidak tampil', (tester) async {
    await tester.pumpWidget(_app(_FakeAuth(), null));
    expect(find.text('Lanjutkan dengan Google'), findsNothing);
  });

  testWidgets('login Google: token dikirim; dibatalkan tanpa pesan galat', (tester) async {
    final auth = _FakeAuth();
    String? token = 'google-id-token';
    await tester.pumpWidget(_app(auth, () async => token));
    await tester.tap(find.text('Lanjutkan dengan Google'));
    await tester.pumpAndSettle();
    expect(auth.usedToken, 'google-id-token');

    auth.usedToken = null;
    token = null; // pengguna menutup pemilih akun
    await tester.tap(find.text('Lanjutkan dengan Google'));
    await tester.pumpAndSettle();
    expect(auth.usedToken, isNull);
    expect(find.text('Terjadi kesalahan. Periksa koneksi lalu coba lagi.'), findsNothing);
  });

  testWidgets('galat login Google ditampilkan', (tester) async {
    final auth = _FakeAuth()..fail = AuthFailure.generic;
    await tester.pumpWidget(_app(auth, () async => 'tok'));
    await tester.tap(find.text('Lanjutkan dengan Google'));
    await tester.pumpAndSettle();
    expect(find.text('Terjadi kesalahan. Periksa koneksi lalu coba lagi.'), findsOneWidget);
  });
}
