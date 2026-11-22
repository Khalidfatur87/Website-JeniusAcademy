import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/providers.dart';
import 'engagement_repository.dart';

/// LATIHAN PINTAR (Leitner 1 → 2 → 4 → 7 → 14 hari). Soal kuis yang salah masuk
/// antrean di database (submit_quiz); jadwal & penilaian sepenuhnya di server.
class PracticeSummary {
  const PracticeSummary({
    required this.due,
    required this.tracked,
    this.nextDue,
  });

  factory PracticeSummary.fromJson(Map<String, dynamic> j) => PracticeSummary(
    due: (j['due'] as num?)?.toInt() ?? 0,
    tracked: (j['tracked'] as num?)?.toInt() ?? 0,
    nextDue: j['next_due'] == null
        ? null
        : DateTime.parse(j['next_due'] as String),
  );

  final int due;
  final int tracked;
  final DateTime? nextDue;
}

class PracticeItem {
  const PracticeItem({
    required this.id,
    required this.courseTitle,
    required this.prompt,
    required this.options,
    required this.box,
  });

  factory PracticeItem.fromJson(Map<String, dynamic> j) => PracticeItem(
    id: j['id'] as String,
    courseTitle: j['course_title'],
    prompt: j['prompt'],
    options: List<Object?>.from(j['options'] as List),
    box: (j['box'] as num?)?.toInt() ?? 0,
  );

  final String id;
  final Object? courseTitle;
  final Object? prompt;
  final List<Object?> options;

  /// Kotak Leitner 0–4.
  final int box;
}

class PracticeAnswer {
  const PracticeAnswer({
    required this.correct,
    required this.answer,
    required this.explanation,
    required this.mastered,
  });

  factory PracticeAnswer.fromJson(Map<String, dynamic> j) => PracticeAnswer(
    correct: j['correct'] as bool? ?? false,
    answer: (j['answer'] as num).toInt(),
    explanation: j['explanation'],
    mastered: j['mastered'] as bool? ?? false,
  );

  final bool correct;
  final int answer;
  final Object? explanation;
  final bool mastered;
}

class PracticeRepository {
  PracticeRepository(this._client);

  final SupabaseClient _client;

  Future<PracticeSummary> summary() async {
    final data = await _client.rpc('practice_summary');
    return PracticeSummary.fromJson(Map<String, dynamic>.from(data as Map));
  }

  /// Sesi berisi sampai 10 soal yang jatuh tempo (tanpa kunci jawaban).
  Future<List<PracticeItem>> queue({int limit = 10}) async {
    final rows =
        await _client.rpc('practice_queue', params: {'p_limit': limit}) as List;
    return [
      for (final r in rows)
        PracticeItem.fromJson(Map<String, dynamic>.from(r as Map)),
    ];
  }

  Future<PracticeAnswer> answer(String questionId, int choice) async {
    final data = await _client.rpc(
      'answer_practice',
      params: {'p_question': questionId, 'p_choice': choice},
    );
    return PracticeAnswer.fromJson(Map<String, dynamic>.from(data as Map));
  }
}

final practiceRepositoryProvider = Provider(
  (ref) => PracticeRepository(ref.watch(supabaseProvider)),
);

final practiceSummaryProvider = FutureProvider<PracticeSummary>((ref) {
  ref.watch(currentUserProvider);
  return ref.watch(practiceRepositoryProvider).summary();
});

/// Setelah menjawab: XP bertambah (soal latihan benar), ringkasan berubah.
void refreshAfterPractice(WidgetRef ref) {
  ref.invalidate(practiceSummaryProvider);
  ref.invalidate(achievementsProvider);
}
