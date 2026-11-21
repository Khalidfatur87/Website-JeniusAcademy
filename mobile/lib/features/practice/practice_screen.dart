import 'package:material_ui/material_ui.dart';

import '../../l10n/app_localizations.dart';
import '../../widgets/async_view.dart';

/// Latihan pintar (Fase 2).
class PracticeScreen extends StatelessWidget {
  const PracticeScreen({super.key});

  @override
  Widget build(BuildContext context) =>
      ComingSoon(title: AppLocalizations.of(context).tabPractice, icon: Icons.fitness_center);
}
