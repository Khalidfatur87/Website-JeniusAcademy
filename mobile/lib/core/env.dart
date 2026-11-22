/// Nilai dari `--dart-define-from-file=env.json` (lihat env.example.json).
///
/// Kunci publishable Supabase aman ada di aplikasi: data tetap dilindungi
/// aturan RLS di database, sama seperti di website.
abstract final class Env {
  static const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
  static const supabaseKey = String.fromEnvironment('SUPABASE_PUBLISHABLE_KEY');

  /// Alamat website, dipakai untuk tautan email (konfirmasi akun, reset sandi).
  /// Garis miring di akhir dibuang, jadi "https://situs.app/" juga aman.
  static String get siteUrl => _siteUrl.replaceAll(RegExp(r'/+$'), '');
  static const _siteUrl = String.fromEnvironment(
    'SITE_URL',
    defaultValue: 'https://example.com',
  );

  /// OAuth Client ID tipe **Web** dari Google Cloud (sama dengan yang diisi di
  /// Supabase → Auth → Providers → Google). Kosong = tombol login Google disembunyikan.
  static const googleWebClientId = String.fromEnvironment('GOOGLE_WEB_CLIENT_ID');

  static bool get hasSupabase => supabaseUrl.isNotEmpty && supabaseKey.isNotEmpty;
}
