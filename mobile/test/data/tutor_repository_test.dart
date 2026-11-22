import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:jeniusacademy/data/tutor_repository.dart';

void main() {
  test(
    'mengirim Bearer & isi permintaan, jawaban dialirkan bertahap',
    () async {
      late http.BaseRequest seen;
      late Map<String, dynamic> body;
      final client = MockClient.streaming((req, bodyStream) async {
        seen = req;
        body = jsonDecode(
          await bodyStream.bytesToString(),
        ) as Map<String, dynamic>;
        return http.StreamedResponse(
          Stream.fromIterable([
            utf8.encode('Fungsi '),
            utf8.encode('kuadrat…'),
          ]),
          200,
        );
      });
      final repo = TutorRepository(accessToken: () => 'tok123', client: client);

      final chunks = await repo
          .askLesson(
            slug: 'mat',
            lessonId: 'kuadrat',
            question: 'Apa itu titik puncak?',
            history: const [
              (role: 'user', content: 'Halo'),
              (role: 'assistant', content: 'Hai!'),
            ],
            locale: 'id',
          )
          .toList();

      expect(chunks.join(), 'Fungsi kuadrat…');
      expect(seen.url.path, '/api/tutor');
      expect(seen.headers['authorization'], 'Bearer tok123');
      expect(body['mode'], 'lesson');
      expect(body['history'], [
        {'role': 'user', 'content': 'Halo'},
        {'role': 'assistant', 'content': 'Hai!'},
      ]);
    },
  );

  test(
    'galat server diterjemahkan; tanpa sesi tidak mengirim apa pun',
    () async {
      Future<TutorError> fails(int status, String code) async {
        final repo = TutorRepository(
          accessToken: () => 'tok',
          client: MockClient(
            (_) async => http.Response(jsonEncode({'error': code}), status),
          ),
        );
        try {
          await repo
              .explainQuiz(questionId: 'q', chosen: 1, locale: 'id')
              .toList();
        } on TutorException catch (e) {
          return e.error;
        }
        fail('seharusnya gagal');
      }

      expect(await fails(429, 'quota'), TutorError.quota);
      expect(await fails(403, 'noAccess'), TutorError.noAccess);
      expect(await fails(503, 'notConfigured'), TutorError.notConfigured);
      expect(await fails(500, 'aneh'), TutorError.generic);

      var called = false;
      final noSession = TutorRepository(
        accessToken: () => null,
        client: MockClient((_) async {
          called = true;
          return http.Response('', 200);
        }),
      );
      await expectLater(
        noSession.explainQuiz(questionId: 'q', locale: 'id').toList(),
        throwsA(
          isA<TutorException>().having(
            (e) => e.error,
            'error',
            TutorError.notSignedIn,
          ),
        ),
      );
      expect(called, isFalse);
    },
  );
}
