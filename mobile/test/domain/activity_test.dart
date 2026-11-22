import 'package:flutter_test/flutter_test.dart';
import 'package:jeniusacademy/domain/activity.dart';

void main() {
  final now = DateTime(2026, 11, 22, 19);
  DateTime d(int day) => DateTime(2026, 11, day);

  test('currentStreak', () {
    expect(currentStreak([], now), 0);
    expect(currentStreak([d(22), d(21), d(20)], now), 3);
    expect(currentStreak([d(21), d(20)], now), 2, reason: 'hari ini belum aktif, kemarin aktif');
    expect(currentStreak([d(20), d(19)], now), 0, reason: 'kemarin tidak aktif = putus');
    expect(currentStreak([d(22), d(20)], now), 1);
    expect(currentStreak([DateTime(2026, 10, 31), DateTime(2026, 11, 1)], DateTime(2026, 11, 1)), 2,
        reason: 'melewati pergantian bulan');
  });
}
