import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import '../../data/auth_repository.dart';
import '../../l10n/app_localizations.dart';
import 'auth_widgets.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  bool _obscure = true;
  AuthFailure? _error;

  @override
  void dispose() {
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
    final res = await ref.read(authRepositoryProvider).signIn(_email.text.trim(), _password.text);
    // Berhasil: router otomatis pindah ke beranda (mendengarkan status login).
    if (mounted) {
      setState(() {
        _busy = false;
        _error = res.error;
      });
    }
  }

  Future<void> _google(Future<String?> Function() idToken) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    final res = await ref.read(authRepositoryProvider).signInWithGoogle(idToken);
    if (mounted) {
      setState(() {
        _busy = false;
        _error = res?.error;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return AuthScaffold(
      title: t.loginTitle,
      subtitle: t.loginSubtitle,
      children: [
        Form(
          key: _form,
          child: AutofillGroup(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
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
                  obscureText: _obscure,
                  decoration: InputDecoration(
                    labelText: t.password,
                    suffixIcon: IconButton(
                      icon: Icon(_obscure ? Icons.visibility : Icons.visibility_off),
                      onPressed: () => setState(() => _obscure = !_obscure),
                    ),
                  ),
                  autofillHints: const [AutofillHints.password],
                  onFieldSubmitted: (_) => _submit(),
                  validator: (v) => validateRequired(t, v),
                ),
              ],
            ),
          ),
        ),
        Align(
          alignment: Alignment.centerRight,
          child: TextButton(
            onPressed: () => context.push('/forgot-password'),
            child: Text(t.forgotPassword),
          ),
        ),
        const SizedBox(height: 8),
        if (_error != null) FormMessage(authErrorText(t, _error!)),
        SubmitButton(label: t.login, busy: _busy, onPressed: _submit),
        if (ref.watch(googleIdTokenProvider) case final idToken?) ...[
          const SizedBox(height: 12),
          Row(
            children: [
              const Expanded(child: Divider()),
              Padding(padding: const EdgeInsets.symmetric(horizontal: 12), child: Text(t.or)),
              const Expanded(child: Divider()),
            ],
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
            onPressed: _busy ? null : () => _google(idToken),
            icon: const Icon(Icons.g_mobiledata, size: 28),
            label: Text(t.continueWithGoogle),
          ),
        ],
        const SizedBox(height: 12),
        TextButton(onPressed: () => context.go('/register'), child: Text(t.noAccount)),
      ],
    );
  }
}
