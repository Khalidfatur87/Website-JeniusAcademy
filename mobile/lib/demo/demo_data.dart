import '../data/course_repository.dart';
import '../data/engagement_repository.dart';
import '../data/lesson_repository.dart';
import '../domain/gamification.dart';

/// Data contoh untuk mode demo (fiktif).
const demoName = 'Rina Putri';

final demoAchievements = AchievementStats(
  xpTotal: 1240,
  xpWeek: 180,
  lessons: 34,
  perfectQuizzes: 3,
  certificates: 1,
  tryouts: 1,
  practiceCorrect: 27,
  activeDays: [for (var d = 1; d <= 12; d++) '2026-11-${d.toString().padLeft(2, '0')}'],
);

List<LeaderboardRow> demoLeaderboard(LeaderboardPeriod period) {
  final rows = period == LeaderboardPeriod.week
      ? const [('Dimas Pratama', 260), ('Aisyah Nur', 215), ('Rina Putri', 180), ('Bagas Saputra', 150), ('Nadia Kirana', 120), ('Fajar Hidayat', 95), ('Salsabila', 70)]
      : const [('Aisyah Nur', 2380), ('Dimas Pratama', 2110), ('Bagas Saputra', 1560), ('Rina Putri', 1240), ('Nadia Kirana', 990), ('Fajar Hidayat', 640), ('Salsabila', 410)];
  return [
    for (final (i, (name, xp)) in rows.indexed)
      LeaderboardRow(rank: i + 1, name: name, xp: xp, isMe: name == demoName),
  ];
}

const demoLevels = [
  Level(id: 'sd', name: {'id': 'SD', 'en': 'Primary'}, position: 0),
  Level(id: 'smp', name: {'id': 'SMP', 'en': 'Junior High'}, position: 1),
  Level(id: 'sma', name: {'id': 'SMA', 'en': 'Senior High'}, position: 2),
  Level(id: 'utbk', name: {'id': 'UTBK', 'en': 'UTBK'}, position: 3),
];

const demoCourses = [
  CourseSummary(
    slug: 'matematika-sma-fungsi',
    levelId: 'sma',
    title: {'id': 'Matematika SMA: Fungsi & Grafik', 'en': 'High School Math: Functions & Graphs'},
    summary: {'id': 'Pahami fungsi linear, kuadrat, dan komposisi lewat contoh soal bertahap.', 'en': 'Understand linear, quadratic and composite functions step by step.'},
    teacherName: 'Pak Andi Wijaya',
    lessonCount: 12,
  ),
  CourseSummary(
    slug: 'fisika-sma-gerak',
    levelId: 'sma',
    title: {'id': 'Fisika SMA: Gerak Lurus', 'en': 'High School Physics: Linear Motion'},
    summary: {'id': 'GLB dan GLBB dengan animasi dan latihan soal ujian.', 'en': 'Uniform and accelerated motion with animations and exam drills.'},
    teacherName: 'Bu Sari Lestari',
    lessonCount: 9,
  ),
  CourseSummary(
    slug: 'utbk-penalaran',
    levelId: 'utbk',
    title: {'id': 'UTBK: Penalaran Umum', 'en': 'UTBK: General Reasoning'},
    summary: {'id': 'Strategi menjawab soal penalaran induktif, deduktif, dan kuantitatif.', 'en': 'Strategies for inductive, deductive and quantitative reasoning.'},
    teacherName: 'Kak Raka Mahendra',
    lessonCount: 15,
  ),
  CourseSummary(
    slug: 'ipa-smp-sel',
    levelId: 'smp',
    title: {'id': 'IPA SMP: Sel & Jaringan', 'en': 'Junior Science: Cells & Tissues'},
    summary: {'id': 'Mengenal sel hewan dan tumbuhan dengan ilustrasi yang mudah diingat.', 'en': 'Animal and plant cells with easy-to-remember illustrations.'},
    teacherName: 'Bu Maya Anggraini',
    lessonCount: 8,
  ),
  CourseSummary(
    slug: 'matematika-sd-pecahan',
    levelId: 'sd',
    title: {'id': 'Matematika SD: Pecahan', 'en': 'Primary Math: Fractions'},
    summary: {'id': 'Belajar pecahan dengan gambar pizza dan kue, seru dan mudah.', 'en': 'Learn fractions with pizza and cake pictures.'},
    teacherName: 'Bu Dewi Kartika',
    lessonCount: 10,
  ),
];

const demoLessons = [
  LessonSummary(id: 'pengenalan', title: {'id': 'Pengenalan fungsi', 'en': 'Introduction to functions'}, minutes: 8, freePreview: true),
  LessonSummary(id: 'domain', title: {'id': 'Domain & range', 'en': 'Domain & range'}, minutes: 12, freePreview: false),
  LessonSummary(id: 'linear', title: {'id': 'Fungsi linear', 'en': 'Linear functions'}, minutes: 15, freePreview: false),
  LessonSummary(id: 'kuadrat', title: {'id': 'Fungsi kuadrat', 'en': 'Quadratic functions'}, minutes: 18, freePreview: false),
  LessonSummary(id: 'grafik', title: {'id': 'Menggambar grafik', 'en': 'Drawing graphs'}, minutes: 14, freePreview: false),
  LessonSummary(id: 'komposisi', title: {'id': 'Fungsi komposisi', 'en': 'Composite functions'}, minutes: 16, freePreview: false),
  LessonSummary(id: 'invers', title: {'id': 'Fungsi invers', 'en': 'Inverse functions'}, minutes: 13, freePreview: false),
];

/// Progres contoh: 3 dari 7 pelajaran kelas matematika sudah selesai.
class DemoProgressRepository implements ProgressRepository {
  final _map = <String, Set<String>>{
    'matematika-sma-fungsi': {'pengenalan', 'domain', 'linear'},
    'fisika-sma-gerak': {'glb'},
  };

  @override
  Future<ProgressMap> load() async => {for (final e in _map.entries) e.key: {...e.value}};

  @override
  Future<void> setDone(String slug, String lessonId, bool done) async {
    final set = _map[slug] ??= {};
    done ? set.add(lessonId) : set.remove(lessonId);
  }
}

const demoLessonContent = LessonContent(
  access: true,
  youtubeId: 'demo',
  notes: {
    'id': 'Fungsi kuadrat berbentuk f(x) = ax² + bx + c dengan a ≠ 0.\n\n'
        '• Jika a > 0, grafik terbuka ke atas dan punya titik minimum.\n'
        '• Jika a < 0, grafik terbuka ke bawah dan punya titik maksimum.\n\n'
        'Titik puncak: x = −b / 2a. Substitusikan nilai x ini ke f(x) untuk mendapatkan nilai y-nya.',
    'en': 'A quadratic function has the form f(x) = ax² + bx + c with a ≠ 0.\n\n'
        '• If a > 0 the graph opens upward and has a minimum.\n'
        '• If a < 0 it opens downward and has a maximum.\n\n'
        'Vertex: x = −b / 2a. Substitute this x into f(x) to get its y value.',
  },
  materials: [
    LessonMaterial(title: 'Ringkasan fungsi kuadrat.pdf', path: 'demo/1.pdf', size: 482304),
    LessonMaterial(title: 'Latihan soal + pembahasan.pdf', path: 'demo/2.pdf', size: 1310720),
  ],
);
