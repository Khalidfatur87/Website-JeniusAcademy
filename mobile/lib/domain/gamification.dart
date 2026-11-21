/// GAMIFIKASI (fungsi murni), port dari `src/lib/gamification.ts`.
/// Jika aturan di website berubah, ubah juga di sini (tesnya sama).
library;

/// XP kumulatif untuk mencapai level n: 50·n·(n−1) → 0, 100, 300, 600, 1000, …
int xpForLevel(int level) => 50 * level * (level - 1);

class LevelInfo {
  const LevelInfo({
    required this.level,
    required this.current,
    required this.needed,
    required this.percent,
  });

  final int level;
  final int current;
  final int needed;
  final int percent;
}

LevelInfo levelFromXp(int xp) {
  var level = 1;
  while (xpForLevel(level + 1) <= xp) {
    level += 1;
  }
  final base = xpForLevel(level);
  final next = xpForLevel(level + 1);
  return LevelInfo(
    level: level,
    current: xp - base,
    needed: next - base,
    percent: ((xp - base) / (next - base) * 100).round(),
  );
}

/// Rangkaian hari berturut-turut terpanjang. [days] berformat "YYYY-MM-DD".
int bestStreak(Iterable<String> days) {
  final sorted = days.toSet().toList()..sort();
  var best = 0;
  var run = 0;
  DateTime? prev;
  for (final d in sorted) {
    final t = DateTime.parse('${d}T00:00:00Z');
    run = prev != null && t.difference(prev).inDays == 1 ? run + 1 : 1;
    if (run > best) best = run;
    prev = t;
  }
  return best;
}

class AchievementStats {
  const AchievementStats({
    this.xpTotal = 0,
    this.xpWeek = 0,
    this.lessons = 0,
    this.perfectQuizzes = 0,
    this.certificates = 0,
    this.tryouts = 0,
    this.practiceCorrect = 0,
    this.activeDays = const [],
  });

  /// Dari RPC `my_achievements`.
  factory AchievementStats.fromJson(Map<String, dynamic> j) => AchievementStats(
        xpTotal: (j['xp_total'] as num?)?.toInt() ?? 0,
        xpWeek: (j['xp_week'] as num?)?.toInt() ?? 0,
        lessons: (j['lessons'] as num?)?.toInt() ?? 0,
        perfectQuizzes: (j['perfect_quizzes'] as num?)?.toInt() ?? 0,
        certificates: (j['certificates'] as num?)?.toInt() ?? 0,
        tryouts: (j['tryouts'] as num?)?.toInt() ?? 0,
        practiceCorrect: (j['practice_correct'] as num?)?.toInt() ?? 0,
        activeDays: [for (final d in (j['active_days'] as List? ?? const [])) '$d'],
      );

  final int xpTotal;
  final int xpWeek;
  final int lessons;
  final int perfectQuizzes;
  final int certificates;
  final int tryouts;
  final int practiceCorrect;
  final List<String> activeDays;
}

enum BadgeId {
  firstLesson,
  tenLessons,
  fiftyLessons,
  perfectQuiz,
  streak7,
  streak30,
  firstCertificate,
  threeCertificates,
  tryoutTaker,
  practice50,
}

bool _earned(BadgeId id, AchievementStats s, int streak) => switch (id) {
      BadgeId.firstLesson => s.lessons >= 1,
      BadgeId.tenLessons => s.lessons >= 10,
      BadgeId.fiftyLessons => s.lessons >= 50,
      BadgeId.perfectQuiz => s.perfectQuizzes >= 1,
      BadgeId.streak7 => streak >= 7,
      BadgeId.streak30 => streak >= 30,
      BadgeId.firstCertificate => s.certificates >= 1,
      BadgeId.threeCertificates => s.certificates >= 3,
      BadgeId.tryoutTaker => s.tryouts >= 1,
      BadgeId.practice50 => s.practiceCorrect >= 50,
    };

/// Lencana yang sudah diraih, urut sesuai daftar di website.
Map<BadgeId, bool> badges(AchievementStats stats) {
  final streak = bestStreak(stats.activeDays);
  return {for (final id in BadgeId.values) id: _earned(id, stats, streak)};
}
