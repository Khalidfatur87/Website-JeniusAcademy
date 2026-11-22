import 'package:flutter_test/flutter_test.dart';
import 'package:jeniusacademy/data/tryout_repository.dart';

void main() {
  test('membaca start_tryout, tryout_result, dan katalog', () {
    final s = TryoutSession.fromJson({
      'started_at': '2026-11-22T10:00:00Z',
      'deadline': '2026-11-22T11:00:00Z',
      'submitted': false,
      'answers': {'q1': 2},
      'sections': [
        {
          'id': 's1',
          'title': {'id': 'PU'},
          'minutes': 30,
          'questions': [
            {
              'id': 'q1',
              'prompt': {'id': 'P'},
              'options': ['a', 'b', 'c'],
            },
          ],
        },
      ],
    });
    expect(s.answers, {'q1': 2});
    expect(s.sections.single.questions.single.options.length, 3);

    final r = TryoutResult.fromJson({
      'score': 7,
      'total': 10,
      'submitted_at': '2026-11-22T10:50:00Z',
      'answers': {'q1': 1},
      'section_scores': [
        {'id': 's1', 'score': 7, 'total': 10},
      ],
      'rank': 3,
      'participants': 40,
      'key': [
        {
          'id': 'q1',
          'section_id': 's1',
          'prompt': {},
          'options': ['a', 'b'],
          'answer': 1,
          'explanation': {},
        },
      ],
      'section_avg': {'s1': 55},
    });
    expect(r.rank, 3);
    expect(r.sectionScores.single.score, 7);
    expect(r.sectionAvg['s1'], 55);

    final info = TryoutInfo.fromJson({
      'slug': 'utbk-1',
      'level_id': 'utbk',
      'title': {},
      'description': {},
      'opens_at': null,
      'closes_at': null,
      'tryout_sections': [
        {'id': 'b', 'title': {}, 'minutes': 20, 'position': 1},
        {'id': 'a', 'title': {}, 'minutes': 10, 'position': 0},
      ],
    });
    expect(info.sections.map((s) => s.id), [
      'a',
      'b',
    ], reason: 'diurutkan menurut position');
  });
}
