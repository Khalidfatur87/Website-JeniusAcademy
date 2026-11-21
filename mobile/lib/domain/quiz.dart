/// KUIS & SERTIFIKAT (fungsi murni), port dari `src/lib/quiz.ts`.
/// Penilaian sebenarnya dilakukan di database (`submit_quiz`, `claim_certificate`);
/// fungsi ini hanya untuk tampilan. Tesnya memakai shared/fixtures/quiz.json.
library;

/// Batas skor kuis untuk sertifikat — sama dengan `certificate_min_percent()` di database.
const certificateMinPercent = 70;

class Attempt {
  const Attempt({required this.courseSlug, required this.score, required this.total, required this.at});

  factory Attempt.fromJson(Map<String, dynamic> j) => Attempt(
        courseSlug: j['course_slug'] as String,
        score: (j['score'] as num).toInt(),
        total: (j['total'] as num).toInt(),
        at: j['created_at'] as String,
      );

  final String courseSlug;
  final int score;
  final int total;

  /// Waktu ISO-8601; dibandingkan sebagai teks (format seragam dari server).
  final String at;
}

double _ratio(int score, int total) => total > 0 ? score / total : 0;

/// Persentase 0–100 (dibulatkan).
int attemptPercent(int score, int total) => (_ratio(score, total) * 100).round();

/// Percobaan terbaik untuk satu kelas (rasio tertinggi; seri → yang terbaru).
Attempt? bestAttempt(Iterable<Attempt> attempts, String courseSlug) {
  Attempt? best;
  for (final a in attempts) {
    if (a.courseSlug != courseSlug) continue;
    final r = _ratio(a.score, a.total);
    if (best == null) {
      best = a;
      continue;
    }
    final b = _ratio(best.score, best.total);
    if (r > b || (r == b && a.at.compareTo(best.at) > 0)) best = a;
  }
  return best;
}

enum CertificateStatus { lessons, quiz, ready }

/// Syarat sertifikat (sama dengan `claim_certificate` di database).
CertificateStatus certificateStatus({
  required int doneLessons,
  required int totalLessons,
  required int quizCount,
  ({int score, int total})? best,
  int minPercent = certificateMinPercent,
}) {
  if (totalLessons == 0 || doneLessons < totalLessons) return CertificateStatus.lessons;
  if (quizCount > 0) {
    if (best == null || best.total == 0 || best.score * 100 < minPercent * best.total) {
      return CertificateStatus.quiz;
    }
  }
  return CertificateStatus.ready;
}

enum QuizVerdict { great, good, needsReview }

/// Pesan hasil kuis: 100% sempurna, ≥70% bagus, di bawahnya tinjau lagi.
QuizVerdict quizVerdict(int percent) => percent == 100
    ? QuizVerdict.great
    : percent >= certificateMinPercent
        ? QuizVerdict.good
        : QuizVerdict.needsReview;
