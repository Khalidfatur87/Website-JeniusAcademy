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
import '../data/lesson_repository.dart';
import '../features/lesson/lesson_screen.dart';
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
        progressRepositoryProvider.overrideWithValue(DemoProgressRepository()),
        lessonContentProvider.overrideWith((ref, key) async => demoLessonContent),
        videoViewProvider.overrideWithValue((_) => const _DemoVideo()),
      ],
      child: const JeniusApp(),
    ),
  );
}

/// Pengganti video YouTube di mode demo (tanpa koneksi ke YouTube).
class _DemoVideo extends StatelessWidget {
  const _DemoVideo();

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 16 / 9,
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: const LinearGradient(
            colors: [Color(0xFF1E6F80), Color(0xFF4B4C99)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Stack(
          children: [
            const Positioned(
              left: 20,
              top: 18,
              child: Text(
                'f(x) = ax² + bx + c',
                style: TextStyle(color: Colors.white70, fontSize: 18, fontStyle: FontStyle.italic),
              ),
            ),
            Center(
              child: Container(
                width: 64,
                height: 64,
                decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                child: const Icon(Icons.play_arrow_rounded, size: 40, color: Color(0xFF1E6F80)),
              ),
            ),
            const Positioned(
              right: 12,
              bottom: 10,
              child: Text('18:00', style: TextStyle(color: Colors.white, fontSize: 13)),
            ),
          ],
        ),
      ),
    );
  }
}
