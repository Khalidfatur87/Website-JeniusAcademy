import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'env.dart';

/// Status layanan setelah aplikasi dibuka.
class Services {
  const Services({required this.supabase, required this.firebase});

  /// Supabase terhubung (env.json terisi).
  final bool supabase;

  /// Firebase siap (google-services.json ada saat build).
  final bool firebase;
}

Future<Services> initServices() async {
  var supabase = false;
  if (Env.hasSupabase) {
    await Supabase.initialize(url: Env.supabaseUrl, publishableKey: Env.supabaseKey);
    supabase = true;
  }

  var firebase = false;
  try {
    await Firebase.initializeApp();
    firebase = true;
  } catch (e) {
    // Tanpa google-services.json aplikasi tetap jalan; push notification mati.
    debugPrint('Firebase tidak aktif: $e');
  }

  return Services(supabase: supabase, firebase: firebase);
}
