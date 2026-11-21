import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/providers.dart';
import '../../data/auth_repository.dart';
import '../../l10n/app_localizations.dart';
import 'auth_widgets.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  AuthFailure? _error;
  bool _needsConfirmation = false;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    final res = await ref.read(authRepositoryProvider).signUp(
          name: _name.text.trim(),
          email: _email.text.trim(),
          password: _password.text,
          locale: ref.read(localeProvider).languageCode,
        );
    if (mounted) {
      setState(() {
        _busy = false;
        _error = res.error;
        _needsConfirmation = res.error == null && res.needsConfirmation;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return AuthScaffold(
      title: t.registerTitle,
      subtitle: t.registerSubtitle,
      children: [
        if (_needsConfirmation) ...[
          FormMessage(t.checkEmail, isError: false),
          FilledButton(onPressed: () => context.go('/login'), child: Text(t.login)),
        ] else ...[
          Form(
            key: _form,
            child: AutofillGroup(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextFormField(
                    controller: _name,
                    decoration: InputDecoration(labelText: t.name),
                    textCapitalization: TextCapitalization.words,
                    autofillHints: const [AutofillHints.name],
                    textInputAction: TextInputAction.next,
                    validator: (v) => validateRequired(t, v),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _email,
                    decoration: InputDecoration(labelText: t.email),
                    keyboardType: TextInputType.emailAddress,
                    autofillHints: const [AutofillHints.email],
                    textInputAction: TextInputAction.next,
                    validator: (v) => validateEmail(t, v),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _password,
                    obscureText: true,
                    decoration: InputDecoration(labelText: t.password),
                    autofillHints: const [AutofillHints.newPassword],
                    onFieldSubmitted: (_) => _submit(),
                    validator: (v) => validateNewPassword(t, v),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          if (_error != null) FormMessage(authErrorText(t, _error!)),
          SubmitButton(label: t.register, busy: _busy, onPressed: _submit),
          const SizedBox(height: 12),
          TextButton(onPressed: () => context.go('/login'), child: Text(t.haveAccount)),
        ],
      ],
    );
  }
}
