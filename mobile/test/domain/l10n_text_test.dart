import 'package:flutter_test/flutter_test.dart';
import 'package:jeniusacademy/domain/l10n_text.dart';

void main() {
  test('memilih bahasa, jatuh ke bahasa Indonesia jika kosong', () {
    expect(pickText({'id': 'Halo', 'en': 'Hello'}, 'en'), 'Hello');
    expect(pickText({'id': 'Halo', 'en': '  '}, 'en'), 'Halo');
    expect(pickText({'id': 'Halo'}, 'en'), 'Halo');
    expect(pickText('teks', 'en'), 'teks');
    expect(pickText(null, 'id'), '');
  });
}
