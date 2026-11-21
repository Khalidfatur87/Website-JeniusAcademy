/// Aturan profil (fungsi murni), sama dengan `src/lib/profile.ts` & `activity.ts`.
library;

const nameMax = 80;
const avatarMaxBytes = 2 * 1024 * 1024;
const avatarTypes = {'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp'};

enum ProfileError { nameRequired, nameTooLong, fileType, fileSize, generic }

/// Nama dirapikan (spasi ganda jadi satu). Hasil `$1` = nama bersih, `$2` = galat.
(String, ProfileError?) cleanName(String input) {
  final clean = input.trim().replaceAll(RegExp(r'\s+'), ' ');
  if (clean.isEmpty) return (clean, ProfileError.nameRequired);
  if (clean.length > nameMax) return (clean, ProfileError.nameTooLong);
  return (clean, null);
}

/// Target pelajaran per minggu: 1–50 (sama dengan batas di database).
int clampGoal(num n) => n.round().clamp(1, 50);

/// Periksa foto sebelum diunggah (bucket juga membatasi tipe & ukuran).
ProfileError? validateAvatar(String mimeType, int bytes) {
  if (!avatarTypes.containsKey(mimeType)) return ProfileError.fileType;
  if (bytes > avatarMaxBytes) return ProfileError.fileSize;
  return null;
}

/// Tipe gambar dari nama file (image_picker tidak selalu memberi MIME).
String mimeFromName(String name) {
  final ext = name.split('.').last.toLowerCase();
  return switch (ext) {
    'png' => 'image/png',
    'webp' => 'image/webp',
    'jpg' || 'jpeg' => 'image/jpeg',
    _ => 'application/octet-stream',
  };
}
