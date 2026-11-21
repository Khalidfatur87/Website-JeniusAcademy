import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:material_ui/material_ui.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/config.dart';
import '../../core/env.dart';
import '../../core/providers.dart';
import '../../data/quiz_repository.dart';
import '../../domain/l10n_text.dart';
import '../../domain/quiz.dart';
import '../../l10n/app_localizations.dart';
import '../../widgets/async_view.dart';

/// Sertifikat milik sendiri. Cetak/PDF memakai halaman website
/// (`/certificates/<kode>`), yang juga menjadi halaman verifikasi publik.
class CertificateScreen extends ConsumerWidget {
  const CertificateScreen({super.key, required this.code});

  final String code;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final t = AppLocalizations.of(context);
    final locale = ref.watch(localeProvider).languageCode;
    final certificates = ref.watch(certificatesProvider);
    final url = '${Env.siteUrl}/$locale/certificates/$code';

    return Scaffold(
      appBar: AppBar(title: Text(t.certificateTitle)),
      body: AsyncView(
        value: certificates,
        onRetry: () => ref.invalidate(certificatesProvider),
        builder: (list) {
          final c = list.where((c) => c.code == code).firstOrNull;
          if (c == null) return ErrorRetry(onRetry: () => ref.invalidate(certificatesProvider));
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _CertificateCard(certificate: c, locale: locale),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: () => launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication),
                icon: const Icon(Icons.print_outlined),
                label: Text(t.printOnWebsite),
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: () async {
                  await Clipboard.setData(ClipboardData(text: url));
                  if (context.mounted) {
                    ScaffoldMessenger.of(context)
                        .showSnackBar(SnackBar(content: Text(t.linkCopied)));
                  }
                },
                icon: const Icon(Icons.link),
                label: Text(t.copyVerifyLink),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _CertificateCard extends StatelessWidget {
  const _CertificateCard({required this.certificate, required this.locale});

  final Certificate certificate;
  final String locale;

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final theme = Theme.of(context);
    final c = certificate;
    // Contoh: "10 November 2026". Data tanggal bahasa dimuat oleh delegasi Material.
    final date = DateFormat.yMMMMd(Localizations.localeOf(context).toString())
        .format(c.issuedAt.toLocal());
    final muted = theme.textTheme.bodySmall?.copyWith(color: const Color(0xFF5B6472));

    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(colors: [AppConfig.primary, AppConfig.accent]),
      ),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 28),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
        ),
        child: DefaultTextStyle.merge(
          style: const TextStyle(color: Color(0xFF1B2430)),
          textAlign: TextAlign.center,
          child: Column(
            children: [
              const Icon(Icons.workspace_premium, size: 48, color: AppConfig.accent),
              const SizedBox(height: 8),
              Text(
                AppConfig.name,
                style: theme.textTheme.titleMedium?.copyWith(
                  color: AppConfig.primary,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 4),
              Text(t.certHeading, style: theme.textTheme.titleLarge?.copyWith(color: const Color(0xFF1B2430))),
              const SizedBox(height: 20),
              Text(t.presentedTo, style: muted),
              const SizedBox(height: 4),
              Text(
                c.recipientName,
                style: theme.textTheme.headlineSmall?.copyWith(
                  color: const Color(0xFF1B2430),
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 12),
              Text(t.forCompleting, style: muted),
              const SizedBox(height: 4),
              Text(
                pickText(c.courseTitle, locale),
                style: theme.textTheme.titleMedium?.copyWith(color: const Color(0xFF1B2430)),
              ),
              if (c.score != null && c.total != null) ...[
                const SizedBox(height: 12),
                Text(t.certQuizScore(c.score!, c.total!, attemptPercent(c.score!, c.total!))),
              ],
              const Divider(height: 32),
              Row(
                children: [
                  Expanded(child: _Meta(label: t.issuedOn, value: date)),
                  Expanded(child: _Meta(label: t.certCode, value: c.code)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Meta extends StatelessWidget {
  const _Meta({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF5B6472))),
        const SizedBox(height: 2),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
      ],
    );
  }
}
