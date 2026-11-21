/// Teks multibahasa dari database: jsonb `{"id": "...", "en": "..."}`.
/// Sama dengan perilaku website: jatuh ke bahasa Indonesia jika terjemahan kosong.
String pickText(Object? value, String locale) {
  if (value is String) return value;
  if (value is! Map) return '';
  final own = value[locale];
  if (own is String && own.trim().isNotEmpty) return own;
  final fallback = value['id'];
  return fallback is String ? fallback : '';
}
