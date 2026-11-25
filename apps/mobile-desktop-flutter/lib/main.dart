import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'presentation/pos_checkout/pos_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    const ProviderScope(
      child: BoutiqueProApp(),
    ),
  );
}

class BoutiqueProApp extends StatelessWidget {
  const BoutiqueProApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Boutique Pro POS',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        primaryColor: const Color(0xFF0F6B4C),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0F6B4C),
          primary: const Color(0xFF0F6B4C),
          secondary: const Color(0xFF00C853),
          background: const Color(0xFF0F1115),
          surface: const Color(0xFF1A1D23),
        ),
        scaffoldBackgroundColor: const Color(0xFF0F1115),
        textTheme: const TextTheme(
          bodyMedium: TextStyle(color: Color(0xFFE0E0E0)),
        ),
      ),
      home: const PosScreen(),
    );
  }
}
