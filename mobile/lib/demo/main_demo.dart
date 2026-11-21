/// MODE DEMO: aplikasi dengan data contoh, tanpa Supabase.
/// Dipakai untuk screenshot portofolio / presentasi, bukan untuk pengguna.
///
///   flutter run -t lib/demo/main_demo.dart
///   flutter build web -t lib/demo/main_demo.dart
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../app.dart';
import '../core/providers.dart';
import '../core/router.dart';
import '../core/services.dart';
import '../data/course_repository.dart';
import '../data/engagement_repository.dart';
import 'demo_data.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    ProviderScope(
      overrides: [
        servicesProvider.overrideWithValue(const Services(supabase: true, firebase: false)),
        routerProvider.overrideWith((ref) => buildRouter()),
        currentUserProvider.overrideWith((ref) => Stream.value(null)),
        myNameProvider.overrideWith((ref) async => demoName),
        achievementsProvider.overrideWith((ref) async => demoAchievements),
        leaderboardProvider.overrideWith((ref, period) async => demoLeaderboard(period)),
        levelsProvider.overrideWith((ref) async => demoLevels),
        coursesProvider.overrideWith((ref) async => demoCourses),
        courseProvider.overrideWith(
          (ref, slug) async => demoCourses.where((c) => c.slug == slug).firstOrNull,
        ),
        lessonsProvider.overrideWith((ref, slug) async => demoLessons),
      ],
      child: const JeniusApp(),
    ),
  );
}
