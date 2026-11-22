import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/providers.dart';
import 'engagement_repository.dart';

class TryoutSectionInfo {
  const TryoutSectionInfo({
    required this.id,
    required this.title,
    required this.minutes,
  });

  final String id;
  final Object? title;
  final int minutes;
}

/// Ringkasan try-out untuk katalog (RLS: hanya yang terbit).
class TryoutInfo {
  const TryoutInfo({
    required this.slug,
    required this.levelId,
    required this.title,
    required this.description,
    required this.opensAt,
    required this.closesAt,
    required this.sections,
  });

  factory TryoutInfo.fromJson(Map<String, dynamic> j) {
    final sections = [...(j['tryout_sections'] as List? ?? const [])]
      ..sort(
        (a, b) => ((a as Map)['position'] as num).compareTo(
          (b as Map)['position'] as num,
        ),
      );
    DateTime? date(Object? v) => v == null ? null : DateTime.parse(v as String);
    return TryoutInfo(
      slug: j['slug'] as String,
      levelId: j['level_id'] as String,
      title: j['title'],
      description: j['description'],
      opensAt: date(j['opens_at']),
      closesAt: date(j['closes_at']),
      sections: [
        for (final s in sections)
          TryoutSectionInfo(
            id: (s as Map)['id'] as String,
            title: s['title'],
            minutes: (s['minutes'] as num).toInt(),
          ),
      ],
    );
  }

  final String slug;
  final String levelId;
  final Object? title;
  final Object? description;
  final DateTime? opensAt;
  final DateTime? closesAt;
  final List<TryoutSectionInfo> sections;
}

class TryoutQuestion {
  const TryoutQuestion({
    required this.id,
    required this.prompt,
    required this.options,
  });

  final String id;
  final Object? prompt;
  final List<Object?> options;
}

class TryoutPaperSection {
  const TryoutPaperSection({
    required this.id,
    required this.title,
    required this.minutes,
    required this.questions,
  });

  final String id;
  final Object? title;
  final int minutes;
  final List<TryoutQuestion> questions;
}

/// Hasil start_tryout: soal (tanpa kunci), waktu mulai & batas dari server.
class TryoutSession {
  const TryoutSession({
    required this.startedAt,
    required this.deadline,
    required this.submitted,
    required this.answers,
    required this.sections,
  });

  factory TryoutSession.fromJson(Map<String, dynamic> j) => TryoutSession(
    startedAt: DateTime.parse(j['started_at'] as String),
    deadline: DateTime.parse(j['deadline'] as String),
    submitted: j['submitted'] as bool? ?? false,
    answers: _answers(j['answers']),
    sections: [
      for (final s in (j['sections'] as List? ?? const []))
        TryoutPaperSection(
          id: (s as Map)['id'] as String,
          title: s['title'],
          minutes: (s['minutes'] as num).toInt(),
          questions: [
            for (final q in (s['questions'] as List? ?? const []))
              TryoutQuestion(
                id: (q as Map)['id'] as String,
                prompt: q['prompt'],
                options: List<Object?>.from(q['options'] as List),
              ),
          ],
        ),
    ],
  );

  final DateTime startedAt;
  final DateTime deadline;
  final bool submitted;
  final Map<String, int> answers;
  final List<TryoutPaperSection> sections;
}

Map<String, int> _answers(Object? raw) => {
  for (final e in ((raw as Map?) ?? const {}).entries)
    if (e.value is num) '${e.key}': (e.value as num).toInt(),
};

class TryoutKeyItem {
  const TryoutKeyItem({
    required this.id,
    required this.sectionId,
    required this.prompt,
    required this.options,
    required this.answer,
    required this.explanation,
  });

  final String id;
  final String sectionId;
  final Object? prompt;
  final List<Object?> options;
  final int answer;
  final Object? explanation;
}

class TryoutResult {
  const TryoutResult({
    required this.score,
    required this.total,
    required this.submittedAt,
    required this.answers,
    required this.sectionScores,
    required this.rank,
    required this.participants,
    required this.key,
    required this.sectionAvg,
  });

  factory TryoutResult.fromJson(Map<String, dynamic> j) => TryoutResult(
    score: (j['score'] as num).toInt(),
    total: (j['total'] as num).toInt(),
    submittedAt: DateTime.parse(j['submitted_at'] as String),
    answers: _answers(j['answers']),
    sectionScores: [
      for (final s in (j['section_scores'] as List? ?? const []))
        (
          id: (s as Map)['id'] as String,
          score: (s['score'] as num).toInt(),
          total: (s['total'] as num).toInt(),
        ),
    ],
    rank: (j['rank'] as num).toInt(),
    participants: (j['participants'] as num).toInt(),
    key: [
      for (final k in (j['key'] as List? ?? const []))
        TryoutKeyItem(
          id: (k as Map)['id'] as String,
          sectionId: k['section_id'] as String,
          prompt: k['prompt'],
          options: List<Object?>.from(k['options'] as List),
          answer: (k['answer'] as num).toInt(),
          explanation: k['explanation'],
        ),
    ],
    sectionAvg: {
      for (final e in ((j['section_avg'] as Map?) ?? const {}).entries)
        '${e.key}': (e.value as num?)?.toInt() ?? 0,
    },
  );

  final int score;
  final int total;
  final DateTime submittedAt;
  final Map<String, int> answers;
  final List<({String id, int score, int total})> sectionScores;
  final int rank;
  final int participants;
  final List<TryoutKeyItem> key;

  /// id subtes → rata-rata persen semua peserta.
  final Map<String, int> sectionAvg;
}

class TryoutLeaderRow {
  const TryoutLeaderRow({
    required this.rank,
    required this.name,
    required this.score,
    required this.total,
    required this.isMe,
  });

  final int rank;

  /// null = peserta menyembunyikan namanya.
  final String? name;
  final int score;
  final int total;
  final bool isMe;
}

class TryoutAttemptState {
  const TryoutAttemptState({required this.slug, required this.submitted});

  final String slug;
  final bool submitted;
}

enum TryoutError { noAccess, closed, notSignedIn, generic }

class TryoutException implements Exception {
  const TryoutException(this.error);
  final TryoutError error;
}

TryoutError _mapError(PostgrestException e) {
  final m = e.message;
  if (m.contains('no_access')) return TryoutError.noAccess;
  if (m.contains('closed')) return TryoutError.closed;
  if (m.contains('not_signed_in')) return TryoutError.notSignedIn;
  return TryoutError.generic;
}

class TryoutRepository {
  TryoutRepository(this._client);

  final SupabaseClient _client;

  Future<List<TryoutInfo>> list() async {
    final rows = await _client
        .from('tryouts')
        .select(
          'slug, level_id, title, description, opens_at, closes_at, '
          'tryout_sections(id, title, minutes, position)',
        )
        .eq('published', true)
        .order('position');
    return [for (final r in rows) TryoutInfo.fromJson(r)];
  }

  /// Percobaan milik sendiri (RLS), untuk label Lanjutkan/Selesai di katalog.
  Future<Map<String, TryoutAttemptState>> myAttempts() async {
    if (_client.auth.currentUser == null) return const {};
    final rows = await _client
        .from('tryout_attempts')
        .select('tryout_slug, submitted_at');
    return {
      for (final r in rows)
        r['tryout_slug'] as String: TryoutAttemptState(
          slug: r['tryout_slug'] as String,
          submitted: r['submitted_at'] != null,
        ),
    };
  }

  /// Mulai atau lanjutkan. Hanya satu percobaan per siswa (untuk peringkat).
  Future<TryoutSession> start(String slug) async {
    try {
      final data = await _client.rpc('start_tryout', params: {'p_slug': slug});
      return TryoutSession.fromJson(Map<String, dynamic>.from(data as Map));
    } on PostgrestException catch (e) {
      throw TryoutException(_mapError(e));
    }
  }

  /// Simpan otomatis. false = waktu sudah habis / sudah diserahkan.
  Future<bool> save(String slug, Map<String, int> answers) async {
    final ok = await _client.rpc(
      'save_tryout_answers',
      params: {'p_slug': slug, 'p_answers': answers},
    );
    return ok == true;
  }

  Future<TryoutResult> submit(String slug, Map<String, int> answers) async {
    try {
      final data = await _client.rpc(
        'submit_tryout',
        params: {'p_slug': slug, 'p_answers': answers},
      );
      return TryoutResult.fromJson(Map<String, dynamic>.from(data as Map));
    } on PostgrestException catch (e) {
      throw TryoutException(_mapError(e));
    }
  }

  Future<TryoutResult?> result(String slug) async {
    final data = await _client.rpc('tryout_result', params: {'p_slug': slug});
    return data == null
        ? null
        : TryoutResult.fromJson(Map<String, dynamic>.from(data as Map));
  }

  Future<List<TryoutLeaderRow>> leaderboard(String slug) async {
    final rows = await _client.rpc(
      'tryout_leaderboard',
      params: {'p_slug': slug},
    ) as List;
    return [
      for (final r in rows)
        TryoutLeaderRow(
          rank: ((r as Map)['rank'] as num).toInt(),
          name: r['name'] as String?,
          score: (r['score'] as num).toInt(),
          total: (r['total'] as num).toInt(),
          isMe: r['is_me'] as bool? ?? false,
        ),
    ];
  }
}

final tryoutRepositoryProvider = Provider(
  (ref) => TryoutRepository(ref.watch(supabaseProvider)),
);

final tryoutsProvider = FutureProvider(
  (ref) => ref.watch(tryoutRepositoryProvider).list(),
);

final tryoutAttemptsProvider = FutureProvider<Map<String, TryoutAttemptState>>((
  ref,
) {
  ref.watch(currentUserProvider);
  return ref.watch(tryoutRepositoryProvider).myAttempts();
});

final tryoutResultProvider = FutureProvider.family<TryoutResult?, String>(
  (ref, slug) => ref.watch(tryoutRepositoryProvider).result(slug),
);

final tryoutLeaderboardProvider =
    FutureProvider.family<List<TryoutLeaderRow>, String>(
      (ref, slug) => ref.watch(tryoutRepositoryProvider).leaderboard(slug),
    );

/// Setelah diserahkan: status, hasil, peringkat, dan XP ikut diperbarui.
void refreshAfterTryout(WidgetRef ref, String slug) {
  ref.invalidate(tryoutAttemptsProvider);
  ref.invalidate(tryoutResultProvider(slug));
  ref.invalidate(tryoutLeaderboardProvider(slug));
  ref.invalidate(achievementsProvider);
}
