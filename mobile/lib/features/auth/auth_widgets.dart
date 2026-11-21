import 'package:material_ui/material_ui.dart';

import '../../core/config.dart';
import '../../data/auth_repository.dart';
import '../../l10n/app_localizations.dart';

/// Kerangka layar login/daftar/lupa sandi.
class AuthScaffold extends StatelessWidget {
  const AuthScaffold({
    super.key,
    required this.title,
    required this.subtitle,
    required this.children,
  });

  final String title;
  final String subtitle;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text.rich(
                    TextSpan(children: [
                      const TextSpan(
                        text: 'Jenius',
                        style: TextStyle(color: AppConfig.primary),
                      ),
                      const TextSpan(
                        text: 'Academy',
                        style: TextStyle(color: AppConfig.accent),
                      ),
                    ]),
                    style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 24),
                  Text(title, style: theme.textTheme.headlineMedium),
                  const SizedBox(height: 4),
                  Text(subtitle, style: theme.textTheme.bodyMedium),
                  const SizedBox(height: 24),
                  ...children,
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

final _emailPattern = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

String? validateEmail(AppLocalizations t, String? v) {
  final s = v?.trim() ?? '';
  if (s.isEmpty) return t.errRequired;
  return _emailPattern.hasMatch(s) ? null : t.errEmail;
}

String? validateRequired(AppLocalizations t, String? v) =>
    (v?.trim() ?? '').isEmpty ? t.errRequired : null;

String? validateNewPassword(AppLocalizations t, String? v) {
  if ((v ?? '').isEmpty) return t.errRequired;
  return v!.length < 8 ? t.errPasswordShort : null;
}

String authErrorText(AppLocalizations t, AuthFailure f) => switch (f) {
      AuthFailure.invalidCredentials => t.errInvalidCredentials,
      AuthFailure.emailNotConfirmed => t.errEmailNotConfirmed,
      AuthFailure.alreadyRegistered => t.errAlreadyRegistered,
      AuthFailure.weakPassword => t.errWeakPassword,
      AuthFailure.rateLimited => t.errRateLimited,
      AuthFailure.generic => t.errGeneric,
    };

/// Kotak pesan di atas tombol (galat atau info).
class FormMessage extends StatelessWidget {
  const FormMessage(this.text, {super.key, this.isError = true});

  final String text;
  final bool isError;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isError ? scheme.errorContainer : scheme.primaryContainer,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: TextStyle(color: isError ? scheme.onErrorContainer : scheme.onPrimaryContainer),
      ),
    );
  }
}

class SubmitButton extends StatelessWidget {
  const SubmitButton({super.key, required this.label, required this.busy, required this.onPressed});

  final String label;
  final bool busy;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return FilledButton(
      onPressed: busy ? null : onPressed,
      style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
      child: busy
          ? const SizedBox.square(dimension: 20, child: CircularProgressIndicator(strokeWidth: 2))
          : Text(label),
    );
  }
}
