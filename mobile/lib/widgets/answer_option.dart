import 'package:material_ui/material_ui.dart';

/// Satu pilihan jawaban (kuis & latihan). [state]: true = kunci, false = jawaban salah, null = biasa.
class AnswerOption extends StatelessWidget {
  const AnswerOption({super.key, required this.text, required this.selected, required this.state, this.onTap});

  final String text;
  final bool selected;
  final bool? state;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final good = Colors.green.shade700;
    final color = switch (state) {
      true => good,
      false => scheme.error,
      null => selected ? scheme.primary : scheme.outlineVariant,
    };
    final icon = switch (state) {
      true => Icons.check_circle,
      false => Icons.cancel,
      null => selected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
    };
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: state == null && !selected ? Colors.transparent : color.withValues(alpha: 0.08),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: color, width: selected || state != null ? 2 : 1),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            child: Row(
              children: [
                Icon(icon, color: color),
                const SizedBox(width: 12),
                Expanded(child: Text(text)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
