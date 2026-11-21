import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/providers.dart';
import '../domain/gamification.dart';

class LeaderboardRow {
  const LeaderboardRow({
    required this.rank,
    required this.name,
    required this.xp,
    required this.isMe,
  });

  factory LeaderboardRow.fromJson(Map<String, dynamic> j) => LeaderboardRow(
        rank: (j['rank'] as num).toInt(),
        name: j['name'] as String? ?? '-',
        xp: (j['xp'] as num).toInt(),
        isMe: j['is_me'] as bool? ?? false,
      );

  final int rank;
  final String name;
  final int xp;
  final bool isMe;
}

enum LeaderboardPeriod { week, all }

class EngagementRepository {
  EngagementRepository(this._client);

  final SupabaseClient _client;

  /// Nama dari tabel profiles (diisi saat daftar).
  Future<String?> myName() async {
    final id = _client.auth.currentUser?.id;
    if (id == null) return null;
    final row = await _client.from('profiles').select('name').eq('id', id).maybeSingle();
    return row?['name'] as String?;
  }

  /// XP, pelajaran, hari aktif, dll. dihitung di database (RPC my_achievements).
  Future<AchievementStats> achievements() async {
    final data = await _client.rpc('my_achievements');
    return AchievementStats.fromJson(Map<String, dynamic>.from(data as Map));
  }

  Future<List<LeaderboardRow>> leaderboard(LeaderboardPeriod period) async {
    final rows = await _client.rpc('xp_leaderboard', params: {'p_period': period.name}) as List;
    return [for (final r in rows) LeaderboardRow.fromJson(Map<String, dynamic>.from(r as Map))];
  }
}

final engagementRepositoryProvider =
    Provider((ref) => EngagementRepository(ref.watch(supabaseProvider)));

final myNameProvider = FutureProvider((ref) {
  ref.watch(currentUserProvider);
  return ref.watch(engagementRepositoryProvider).myName();
});

final achievementsProvider = FutureProvider((ref) {
  ref.watch(currentUserProvider);
  return ref.watch(engagementRepositoryProvider).achievements();
});

final leaderboardProvider = FutureProvider.family<List<LeaderboardRow>, LeaderboardPeriod>(
  (ref, period) => ref.watch(engagementRepositoryProvider).leaderboard(period),
);
