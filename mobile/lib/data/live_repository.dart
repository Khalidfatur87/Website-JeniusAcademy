import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/providers.dart';

/// Jadwal kelas live. Link Zoom/Meet & rekaman TIDAK bisa dibaca dari tabel
/// (izin kolom); hanya lewat RPC live_access untuk yang berhak.
class LiveSession {
  const LiveSession({
    required this.id,
    required this.levelId,
    required this.title,
    required this.description,
    required this.startsAt,
    required this.minutes,
    required this.hostName,
  });

  factory LiveSession.fromJson(Map<String, dynamic> j) => LiveSession(
    id: j['id'] as String,
    levelId: j['level_id'] as String,
    title: j['title'],
    description: j['description'],
    startsAt: DateTime.parse(j['starts_at'] as String),
    minutes: (j['minutes'] as num).toInt(),
    hostName: j['host_name'] as String? ?? '',
  );

  final String id;
  final String levelId;
  final Object? title;
  final Object? description;
  final DateTime startsAt;
  final int minutes;
  final String hostName;
}

class LiveAccess {
  const LiveAccess({
    required this.access,
    this.joinUrl,
    this.recordingYoutubeId,
  });

  final bool access;

  /// Hanya terisi 15 menit sebelum mulai sampai selesai.
  final String? joinUrl;
  final String? recordingYoutubeId;
}

class LiveRepository {
  LiveRepository(this._client);

  final SupabaseClient _client;

  Future<List<LiveSession>> list() async {
    final rows = await _client
        .from('live_sessions')
        .select(
          'id, level_id, title, description, starts_at, minutes, host_name',
        )
        .order('starts_at');
    return [for (final r in rows) LiveSession.fromJson(r)];
  }

  Future<LiveAccess?> access(String id) async {
    final data = await _client.rpc('live_access', params: {'p_id': id});
    if (data == null) return null;
    final j = Map<String, dynamic>.from(data as Map);
    return LiveAccess(
      access: j['access'] == true,
      joinUrl: j['join_url'] as String?,
      recordingYoutubeId: j['recording_youtube_id'] as String?,
    );
  }
}

final liveRepositoryProvider = Provider(
  (ref) => LiveRepository(ref.watch(supabaseProvider)),
);
final liveSessionsProvider = FutureProvider(
  (ref) => ref.watch(liveRepositoryProvider).list(),
);
final liveAccessProvider = FutureProvider.family<LiveAccess?, String>((
  ref,
  id,
) {
  ref.watch(currentUserProvider);
  return ref.watch(liveRepositoryProvider).access(id);
});
