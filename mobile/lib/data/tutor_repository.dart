import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;

import '../core/config.dart';
import '../core/env.dart';
import '../core/providers.dart';

/// Tutor AI aktif? (saklar AppConfig.tutorAi; diganti di tes).
final tutorEnabledProvider = Provider<bool>((ref) => AppConfig.tutorAi);

enum TutorError {
  invalid,
  notSignedIn,
  noAccess,
  quota,
  notConfigured,
  generic,
}

class TutorException implements Exception {
  const TutorException(this.error);
  final TutorError error;
}

typedef TutorTurn = ({String role, String content});

/// Memanggil `/api/tutor` di website dengan token sesi aplikasi (Bearer).
/// Akses materi & kuota harian diperiksa di server; jawaban dialirkan bertahap.
class TutorRepository {
  TutorRepository({required this.accessToken, http.Client? client})
    : _http = client ?? http.Client();

  final String? Function() accessToken;
  final http.Client _http;

  Stream<String> _ask(Map<String, Object?> body) async* {
    final token = accessToken();
    if (token == null) throw const TutorException(TutorError.notSignedIn);
    final req = http.Request('POST', Uri.parse('${Env.siteUrl}/api/tutor'))
      ..headers['content-type'] = 'application/json'
      ..headers['authorization'] = 'Bearer $token'
      ..body = jsonEncode(body);
    final http.StreamedResponse res;
    try {
      res = await _http.send(req);
    } catch (_) {
      throw const TutorException(TutorError.generic);
    }
    if (res.statusCode != 200) {
      final text = await res.stream.bytesToString();
      final code = (jsonDecode(text.isEmpty ? '{}' : text) as Map?)?['error'];
      throw TutorException(
        TutorError.values.firstWhere(
          (e) => e.name == code,
          orElse: () => TutorError.generic,
        ),
      );
    }
    yield* res.stream.transform(utf8.decoder);
  }

  /// Pertanyaan bebas tentang satu pelajaran (dengan riwayat percakapan).
  Stream<String> askLesson({
    required String slug,
    required String lessonId,
    required String question,
    required List<TutorTurn> history,
    required String locale,
  }) => _ask({
    'mode': 'lesson',
    'slug': slug,
    'lessonId': lessonId,
    'question': question,
    'history': [
      for (final h in history) {'role': h.role, 'content': h.content},
    ],
    'locale': locale,
  });

  /// Penjelasan soal kuis yang dijawab salah.
  Stream<String> explainQuiz({
    required String questionId,
    int? chosen,
    required String locale,
  }) => _ask({
    'mode': 'quiz',
    'questionId': questionId,
    'chosen': chosen,
    'locale': locale,
  });
}

final tutorRepositoryProvider = Provider(
  (ref) => TutorRepository(
    accessToken: () =>
        ref.read(supabaseProvider).auth.currentSession?.accessToken,
  ),
);
