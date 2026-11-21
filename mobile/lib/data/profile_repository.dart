import 'dart:typed_data';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/providers.dart';
import '../domain/profile.dart';

class Profile {
  const Profile({
    required this.name,
    required this.avatarUrl,
    required this.weeklyGoal,
    required this.showOnLeaderboard,
  });

  final String? name;
  final String? avatarUrl;
  final int weeklyGoal;
  final bool showOnLeaderboard;
}

class ProfileException implements Exception {
  const ProfileException(this.error);
  final ProfileError error;
}

/// Profil sendiri. Database hanya mengizinkan mengubah kolom name, avatar_path,
/// weekly_goal, show_on_leaderboard, dan foto hanya di folder `avatars/<id sendiri>/`.
abstract class ProfileRepository {
  Future<Profile?> load();
  Future<void> updateName(String name);
  Future<void> updateWeeklyGoal(int goal);
  Future<void> setShowOnLeaderboard(bool show);
  Future<void> uploadAvatar(Uint8List bytes, String mimeType);
  Future<void> removeAvatar();
}

class SupabaseProfileRepository implements ProfileRepository {
  SupabaseProfileRepository(this._client);

  final SupabaseClient _client;

  String get _uid {
    final id = _client.auth.currentUser?.id;
    if (id == null) throw const ProfileException(ProfileError.generic);
    return id;
  }

  SupabaseQueryBuilder get _profiles => _client.from('profiles');
  StorageFileApi get _avatars => _client.storage.from('avatars');

  @override
  Future<Profile?> load() async {
    final id = _client.auth.currentUser?.id;
    if (id == null) return null;
    final r = await _profiles
        .select('name, avatar_path, weekly_goal, show_on_leaderboard')
        .eq('id', id)
        .maybeSingle();
    if (r == null) return null;
    final path = r['avatar_path'] as String?;
    return Profile(
      name: r['name'] as String?,
      avatarUrl: path == null ? null : _avatars.getPublicUrl(path),
      weeklyGoal: (r['weekly_goal'] as num?)?.toInt() ?? 5,
      showOnLeaderboard: r['show_on_leaderboard'] as bool? ?? true,
    );
  }

  @override
  Future<void> updateName(String name) async {
    final (clean, error) = cleanName(name);
    if (error != null) throw ProfileException(error);
    await _profiles.update({'name': clean}).eq('id', _uid);
    // Samakan metadata akun seperti website (dipakai sebelum profil termuat).
    try {
      await _client.auth.updateUser(UserAttributes(data: {'name': clean}));
    } catch (_) {}
  }

  @override
  Future<void> updateWeeklyGoal(int goal) =>
      _profiles.update({'weekly_goal': clampGoal(goal)}).eq('id', _uid);

  @override
  Future<void> setShowOnLeaderboard(bool show) =>
      _profiles.update({'show_on_leaderboard': show}).eq('id', _uid);

  Future<String?> _oldPath(String uid) async {
    final r = await _profiles.select('avatar_path').eq('id', uid).maybeSingle();
    return r?['avatar_path'] as String?;
  }

  /// Unggah ke `avatars/<id>/<waktu>.<ext>`, simpan di profil, lalu hapus foto lama.
  @override
  Future<void> uploadAvatar(Uint8List bytes, String mimeType) async {
    final error = validateAvatar(mimeType, bytes.length);
    if (error != null) throw ProfileException(error);
    final uid = _uid;
    final path = '$uid/${DateTime.now().millisecondsSinceEpoch}.${avatarTypes[mimeType]}';
    final old = await _oldPath(uid);
    await _avatars.uploadBinary(path, bytes, fileOptions: FileOptions(contentType: mimeType));
    try {
      await _profiles.update({'avatar_path': path}).eq('id', uid);
    } catch (_) {
      await _avatars.remove([path]);
      rethrow;
    }
    if (old != null) await _avatars.remove([old]);
  }

  @override
  Future<void> removeAvatar() async {
    final uid = _uid;
    final old = await _oldPath(uid);
    await _profiles.update({'avatar_path': null}).eq('id', uid);
    if (old != null) await _avatars.remove([old]);
  }
}

final profileRepositoryProvider = Provider<ProfileRepository>(
  (ref) => SupabaseProfileRepository(ref.watch(supabaseProvider)),
);

final profileProvider = FutureProvider<Profile?>((ref) {
  ref.watch(currentUserProvider);
  return ref.watch(profileRepositoryProvider).load();
});
