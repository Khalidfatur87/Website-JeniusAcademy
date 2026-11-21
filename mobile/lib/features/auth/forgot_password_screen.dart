import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/providers.dart';
import '../../data/auth_repository.dart';
import '../../l10n/app_localizations.dart';
import 'auth_widgets.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  bool _busy = false;
  bool _sent = false;
  AuthFailure? _error;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    final res = await ref
        .read(authRepositoryProvider)
        .sendPasswordReset(_email.text.trim(), ref.read(localeProvider).languageCode);
    if (mounted) {
      setState(() {
        _busy = false;
        _error = res.error;
        _sent = res.error == null;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return AuthScaffold(
      title: t.forgotTitle,
      subtitle: t.forgotSubtitle,
      children: [
        if (_sent)
          FormMessage(t.linkSent, isError: false)
        else ...[
          Form(
            key: _form,
            child: TextFormField(
              controller: _email,
              decoration: InputDecoration(labelText: t.email),
              keyboardType: TextInputType.emailAddress,
              autofillHints: const [AutofillHints.email],
              onFieldSubmitted: (_) => _submit(),
              validator: (v) => validateEmail(t, v),
            ),
          ),
          const SizedBox(height: 24),
          if (_error != null) FormMessage(authErrorText(t, _error!)),
          SubmitButton(label: t.sendLink, busy: _busy, onPressed: _submit),
        ],
      ],
    );
  }
}
