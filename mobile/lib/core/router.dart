import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import '../features/auth/forgot_password_screen.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/register_screen.dart';
import '../features/courses/course_detail_screen.dart';
import '../features/courses/courses_screen.dart';
import '../features/home/home_screen.dart';
import '../features/lesson/lesson_screen.dart';
import '../features/leaderboard/leaderboard_screen.dart';
import '../features/practice/practice_screen.dart';
import '../features/profile/profile_screen.dart';
import '../features/shell/main_shell.dart';
import 'providers.dart';

const _publicPaths = {'/login', '/register', '/forgot-password'};

/// Memberi tahu router setiap kali status login berubah.
class _AuthListenable extends ChangeNotifier {
  _AuthListenable(Stream<Object?> stream) {
    _sub = stream.listen((_) => notifyListeners());
  }

  late final StreamSubscription<Object?> _sub;

  @override
  void dispose() {
    _sub.cancel();
    super.dispose();
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(supabaseProvider).auth;
  final refresh = _AuthListenable(auth.onAuthStateChange);
  ref.onDispose(refresh.dispose);

  return buildRouter(
    refreshListenable: refresh,
    // Belum login → halaman login. Sudah login → tidak perlu lagi melihat halaman login.
    redirect: (context, state) {
      final signedIn = auth.currentUser != null;
      final public = _publicPaths.contains(state.matchedLocation);
      if (!signedIn && !public) return '/login';
      if (signedIn && public) return '/home';
      return null;
    },
  );
});

/// Daftar layar aplikasi. Dipakai juga oleh mode demo (tanpa pemeriksaan login).
GoRouter buildRouter({Listenable? refreshListenable, GoRouterRedirect? redirect}) {
  return GoRouter(
    initialLocation: '/home',
    refreshListenable: refreshListenable,
    redirect: redirect,
    routes: [
      GoRoute(path: '/login', builder: (_, _) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, _) => const RegisterScreen()),
      GoRoute(path: '/forgot-password', builder: (_, _) => const ForgotPasswordScreen()),
      GoRoute(
        path: '/courses/:slug',
        builder: (_, s) => CourseDetailScreen(slug: s.pathParameters['slug']!),
      ),
      GoRoute(
        path: '/courses/:slug/:lessonId',
        builder: (_, s) => LessonScreen(
          slug: s.pathParameters['slug']!,
          lessonId: s.pathParameters['lessonId']!,
        ),
      ),
      StatefulShellRoute.indexedStack(
        builder: (_, _, shell) => MainShell(shell: shell),
        branches: [
          _branch('/home', const HomeScreen()),
          _branch('/courses', const CoursesScreen()),
          _branch('/practice', const PracticeScreen()),
          _branch('/leaderboard', const LeaderboardScreen()),
          _branch('/profile', const ProfileScreen()),
        ],
      ),
    ],
  );
}

StatefulShellBranch _branch(String path, Widget screen) => StatefulShellBranch(
      routes: [GoRoute(path: path, builder: (_, _) => screen)],
    );
