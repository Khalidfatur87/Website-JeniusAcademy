import 'package:flutter_test/flutter_test.dart';
import 'package:jeniusacademy/domain/profile.dart';

void main() {
  test('cleanName merapikan spasi dan memeriksa panjang', () {
    expect(cleanName('  Rina   Putri  '), ('Rina Putri', null));
    expect(cleanName('   ').$2, ProfileError.nameRequired);
    expect(cleanName('a' * 81).$2, ProfileError.nameTooLong);
    expect(cleanName('a' * 80).$2, isNull);
  });

  test('clampGoal 1–50', () {
    expect(clampGoal(0), 1);
    expect(clampGoal(7.4), 7);
    expect(clampGoal(99), 50);
  });

  test('validateAvatar', () {
    expect(validateAvatar('image/jpeg', 1000), isNull);
    expect(validateAvatar('image/gif', 1000), ProfileError.fileType);
    expect(validateAvatar('image/png', 3 * 1024 * 1024), ProfileError.fileSize);
  });

  test('mimeFromName', () {
    expect(mimeFromName('foto.JPG'), 'image/jpeg');
    expect(mimeFromName('a.webp'), 'image/webp');
    expect(mimeFromName('a.heic'), 'application/octet-stream');
  });
}
