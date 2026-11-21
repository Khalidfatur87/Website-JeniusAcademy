import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:jeniusacademy/app.dart';
import 'package:jeniusacademy/core/providers.dart';
import 'package:jeniusacademy/core/services.dart';

void main() {
  testWidgets('tanpa env.json menampilkan petunjuk konfigurasi', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          servicesProvider.overrideWithValue(const Services(supabase: false, firebase: false)),
        ],
        child: const JeniusApp(),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('Aplikasi belum dikonfigurasi'), findsOneWidget);
  });
}
