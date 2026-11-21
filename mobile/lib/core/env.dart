/// Nilai dari `--dart-define-from-file=env.json` (lihat env.example.json).
///
/// Kunci publishable Supabase aman ada di aplikasi: data tetap dilindungi
/// aturan RLS di database, sama seperti di website.
abstract final class Env {
  static const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
  static const supabaseKey = String.fromEnvironment('SUPABASE_PUBLISHABLE_KEY');

  /// Alamat website, dipakai untuk tautan email (konfirmasi akun, reset sandi).
  static const siteUrl = String.fromEnvironment(
    'SITE_URL',
    defaultValue: 'https://example.com',
  );

  static bool get hasSupabase => supabaseUrl.isNotEmpty && supabaseKey.isNotEmpty;
}
