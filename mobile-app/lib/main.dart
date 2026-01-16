import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/presentation/providers/auth_provider.dart';

void main() {
  runApp(
    const ProviderScope(
      child: RecapVideoApp(),
    ),
  );
}

class RecapVideoApp extends ConsumerStatefulWidget {
  const RecapVideoApp({super.key});

  @override
  ConsumerState<RecapVideoApp> createState() => _RecapVideoAppState();
}

class _RecapVideoAppState extends ConsumerState<RecapVideoApp> {
  @override
  void initState() {
    super.initState();
    // Frame ပြီးမှ auth initialize စမယ် (build cycle conflict မဖြစ်အောင်)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initializeAuth();
    });
  }

  Future<void> _initializeAuth() async {
    try {
      await ref.read(authProvider.notifier).initialize();
    } catch (e) {
      debugPrint('Auth initialization error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(appRouterProvider);
    
    return MaterialApp.router(
      title: 'RecapVideo.ai',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.dark, // Always dark mode
      routerConfig: router,
      // Auth initialize မပြီးခင် splash screen ပြမယ်
      builder: (context, child) {
        final authState = ref.watch(authProvider);
        if (!authState.isInitialized) {
          return _buildSplashScreen(context);
        }
        return child ?? const SizedBox.shrink();
      },
    );
  }

  // Splash Screen - Auth loading ပြနေစဉ် (Lottie Animation)
  Widget _buildSplashScreen(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Lottie Animation or Fallback Logo
            SizedBox(
              width: 180,
              height: 180,
              child: _buildLogoAnimation(),
            ),
            const SizedBox(height: 24),
            // App Name with gradient effect
            ShaderMask(
              shaderCallback: (bounds) => const LinearGradient(
                colors: [Color(0xFF8B5CF6), Color(0xFFEC4899)],
              ).createShader(bounds),
              child: const Text(
                'RecapVideo.AI',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
            const SizedBox(height: 8),
            // Tagline
            Text(
              'AI Video Creation',
              style: TextStyle(
                fontSize: 14,
                color: Colors.white.withAlpha(150),
              ),
            ),
            const SizedBox(height: 40),
            // Loading indicator with pulse animation
            TweenAnimationBuilder<double>(
              tween: Tween(begin: 0.5, end: 1.0),
              duration: const Duration(milliseconds: 800),
              curve: Curves.easeInOut,
              builder: (context, value, child) {
                return Transform.scale(
                  scale: value,
                  child: child,
                );
              },
              onEnd: () {},
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF8B5CF6).withAlpha(30),
                  borderRadius: BorderRadius.circular(50),
                ),
                child: const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF8B5CF6)),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Logo Animation Widget - Actual Logo or Fallback
  Widget _buildLogoAnimation() {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF8B5CF6), Color(0xFFEC4899)],
        ),
        borderRadius: BorderRadius.circular(36),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF8B5CF6).withAlpha(100),
            blurRadius: 40,
            spreadRadius: 8,
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Image.asset(
          'assets/images/logo.png',
          width: 100,
          height: 100,
          fit: BoxFit.contain,
          errorBuilder: (_, __, ___) => const Icon(
            Icons.video_library_rounded,
            size: 80,
            color: Colors.white,
          ),
        ),
      ),
    );
  }
}
