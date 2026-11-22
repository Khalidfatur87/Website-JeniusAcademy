import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/providers.dart';
import '../domain/quiz.dart';
import 'engagement_repository.dart';

/// Soal tanpa kunci jawaban: kolom `answer` & `explanation` memang tidak bisa
/// dibaca langsung (izin kolom di database), baru dikirim setelah dinilai.
class QuizQuestion {
  const QuizQuestion({
    required this.id,
    required this.prompt,
    required this.options,
  });

  factory QuizQuestion.fromJson(Map<String, dynamic> j) => QuizQuestion(
    id: j['id'] as String,
    prompt: j['prompt'],
    options: List<Object?>.from(j['options'] as List),
  );

  final String id;
  final Object? prompt;
  final List<Object?> options;
}

class QuestionResult {
  const QuestionResult({
    required this.id,
    required this.answer,
    required this.explanation,
  });

  final String id;
  final int answer;
  final Object? explanation;
}

class QuizResult {
  const QuizResult({
    required this.score,
    required this.total,
    required this.recorded,
    required this.results,
  });

  factory QuizResult.fromJson(Map<String, dynamic> j) => QuizResult(
    score: (j['score'] as num).toInt(),
    total: (j['total'] as num).toInt(),
    recorded: j['recorded'] as bool? ?? false,
    results: {
      for (final r in (j['results'] as List? ?? const []))
        (r as Map)['id'] as String: QuestionResult(
          id: r['id'] as String,
          answer: (r['answer'] as num).toInt(),
          explanation: r['explanation'],
        ),
    },
  );

  final int score;
  final int total;
  final bool recorded;

  /// id soal → kunci & pembahasan.
  final Map<String, QuestionResult> results;
}

class Certificate {
  const Certificate({
    required this.code,
    required this.courseSlug,
    required this.courseTitle,
    required this.recipientName,
    required this.score,
    required this.total,
    required this.issuedAt,
  });

  factory Certificate.fromJson(Map<String, dynamic> j) => Certificate(
    code: j['code'] as String,
    courseSlug: j['course_slug'] as String,
    courseTitle: j['course_title'],
    recipientName: j['recipient_name'] as String? ?? '',
    score: (j['score'] as num?)?.toInt(),
    total: (j['total'] as num?)?.toInt(),
    issuedAt: DateTime.parse(j['issued_at'] as String),
  );

  final String code;
  final String courseSlug;
  final Object? courseTitle;
  final String recipientName;
  final int? score;
  final int? total;
  final DateTime issuedAt;
}

enum QuizError { noAccess, generic }

enum CertificateError { notComplete, quizRequired, noAccess, generic }

class QuizException implements Exception {
  const QuizException(this.error);
  final QuizError error;
}

class CertificateException implements Exception {
  const CertificateException(this.error);
  final CertificateError error;
}

class QuizRepository {
  QuizRepository(this._client);

  final SupabaseClient _client;

  Future<List<QuizQuestion>> questions(String slug) async {
    final rows = await _client
        .from('quiz_questions')
        .select('id, prompt, options')
        .eq('course_slug', slug)
        .order('position');
    return [for (final r in rows) QuizQuestion.fromJson(r)];
  }

  /// Dinilai di server; skor otomatis tercatat di `quiz_attempts`.
  Future<QuizResult> submit(String slug, Map<String, int> answers) async {
    try {
      final data = await _client.rpc(
        'submit_quiz',
        params: {'p_slug': slug, 'p_answers': answers},
      );
      return QuizResult.fromJson(Map<String, dynamic>.from(data as Map));
    } on PostgrestException catch (e) {
      throw QuizException(
        e.message.contains('no_access')
            ? QuizError.noAccess
            : QuizError.generic,
      );
    }
  }

  Future<List<Attempt>> attempts() async {
    if (_client.auth.currentUser == null) return const [];
    final rows = await _client
        .from('quiz_attempts')
        .select('course_slug, score, total, created_at')
        .order('created_at', ascending: false);
    return [for (final r in rows) Attempt.fromJson(r)];
  }

  Future<List<Certificate>> certificates() async {
    if (_client.auth.currentUser == null) return const [];
    final rows = await _client
        .from('certificates')
        .select(
          'code, course_slug, course_title, recipient_name, score, total, issued_at',
        )
        .order('issued_at', ascending: false);
    return [for (final r in rows) Certificate.fromJson(r)];
  }

  /// Syarat diperiksa ulang di database; hasilnya kode sertifikat.
  Future<String> claimCertificate(String slug) async {
    try {
      final code = await _client.rpc(
        'claim_certificate',
        params: {'p_slug': slug},
      );
      return code as String;
    } on PostgrestException catch (e) {
      final m = e.message;
      throw CertificateException(
        m.contains('not_complete')
            ? CertificateError.notComplete
            : m.contains('quiz_required')
            ? CertificateError.quizRequired
            : m.contains('no_access')
            ? CertificateError.noAccess
            : CertificateError.generic,
      );
    }
  }
}

final quizRepositoryProvider = Provider(
  (ref) => QuizRepository(ref.watch(supabaseProvider)),
);

final quizQuestionsProvider = FutureProvider.family<List<QuizQuestion>, String>(
  (ref, slug) => ref.watch(quizRepositoryProvider).questions(slug),
);

final attemptsProvider = FutureProvider<List<Attempt>>((ref) {
  ref.watch(currentUserProvider);
  return ref.watch(quizRepositoryProvider).attempts();
});

final certificatesProvider = FutureProvider<List<Certificate>>((ref) {
  ref.watch(currentUserProvider);
  return ref.watch(quizRepositoryProvider).certificates();
});

/// Kirim jawaban lalu segarkan riwayat skor dan XP.
Future<QuizResult> submitQuiz(
  WidgetRef ref,
  String slug,
  Map<String, int> answers,
) async {
  final result = await ref.read(quizRepositoryProvider).submit(slug, answers);
  ref.invalidate(attemptsProvider);
  ref.invalidate(achievementsProvider);
  return result;
}

/// Ambil sertifikat lalu segarkan daftar sertifikat dan XP.
Future<String> claimCertificate(WidgetRef ref, String slug) async {
  final code = await ref.read(quizRepositoryProvider).claimCertificate(slug);
  ref.invalidate(certificatesProvider);
  ref.invalidate(achievementsProvider);
  return code;
}
