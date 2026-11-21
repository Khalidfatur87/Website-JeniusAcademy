import 'package:material_ui/material_ui.dart';

/// Pusat konfigurasi aplikasi, padanan `src/config/site.ts` di website.
abstract final class AppConfig {
  static const name = 'JeniusAcademy';

  /// Warna brand, sama dengan `siteConfig.colors`.
  static const primary = Color(0xFF2B93A8);
  static const accent = Color(0xFF6A6BBD);

  static const defaultLocale = Locale('id');
  static const locales = [Locale('id'), Locale('en')];

  /// Saklar fitur.
  /// Tutor AI butuh API berbayar (Anthropic), jadi dimatikan di versi gratis.
  static const tutorAi = false;
}
