import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/navigation/main_navigation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/signup_screen.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/videos/presentation/screens/video_detail_screen.dart';
import '../../features/credits/presentation/screens/order_history_screen.dart';
import '../api/video_service.dart';

/// Deep Link Configuration
class DeepLinkConfig {
  /// App scheme for deep links
  static const scheme = 'recapvideo';
  
  /// Web URL for universal links
  static const webHost = 'recapvideo.ai';
  
  /// Deep link paths
  static const videoPath = '/video/:id';
  static const orderPath = '/order/:id';
  static const createPath = '/create';
  static const creditsPath = '/credits';
}

/// App Router Configuration with Auth Guards and Deep Links
final appRouterProvider = Provider<GoRouter>((ref) {
  // ref.watch အစား refreshListenable သုံးမယ် - LoginScreen rebuild မဖြစ်အောင်
  final authChangeNotifier = ref.watch(authChangeNotifierProvider);
  
  return GoRouter(
    initialLocation: '/', // Root location as starting point
    debugLogDiagnostics: true,
    
    // Auth state ပြောင်းမှသာ redirect ပြန်စစ်မယ် (loading state ignore)
    refreshListenable: authChangeNotifier,
    
    // Route guards - redirect based on auth state
    redirect: (context, state) {
      // ref.read သုံးမယ် - rebuild မဖြစ်အောင်
      final authState = ref.read(authProvider);
      
      // Auth initialize မပြီးသေးရင် redirect မလုပ်ဘူး
      // (Splash screen ပြနေဆဲ)
      if (!authState.isInitialized) {
        return null;
      }
      
      final isAuthenticated = authState.isAuthenticated;
      final isLoginRoute = state.matchedLocation == '/login';
      final isSignupRoute = state.matchedLocation == '/signup';
      final isAuthRoute = isLoginRoute || isSignupRoute;
      final isRootRoute = state.matchedLocation == '/';
      
      // If not authenticated and trying to access protected route (or root)
      if (!isAuthenticated && (!isAuthRoute || isRootRoute)) {
        return '/login';
      }
      
      // If authenticated and trying to access auth routes (or root)
      if (isAuthenticated && (isAuthRoute || isRootRoute)) {
        return '/home';
      }
      
      return null; // No redirect needed
    },
    
    routes: [
      // Root Route (Placeholder for redirection)
      GoRoute(
        path: '/',
        name: 'root',
        builder: (context, state) => const SizedBox.shrink(),
      ),

      // Auth Routes
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/signup',
        name: 'signup',
        builder: (context, state) => const SignupScreen(),
      ),
      
      // Home Route (Protected)
      GoRoute(
        path: '/home',
        name: 'home',
        builder: (context, state) => const MainNavigation(),
      ),
      
      // Deep Link Routes ----------------------
      
      // Video Detail - recapvideo://video/123 or https://recapvideo.ai/video/123
      GoRoute(
        path: '/video/:id',
        name: 'videoDetail',
        builder: (context, state) {
          final videoId = state.pathParameters['id'] ?? '';
          final video = state.extra as Video?;
          return VideoDetailScreen(
            videoId: videoId,
            title: video?.title,
            thumbnailUrl: video?.sourceThumbnail,
            videoUrl: video?.videoUrl,
            status: video?.status ?? 'completed',
            video: video,
          );
        },
      ),
      
      // Order Detail - recapvideo://order/123
      GoRoute(
        path: '/order/:id',
        name: 'orderDetail',
        builder: (context, state) {
          // Navigate to order history with specific order
          return const OrderHistoryScreen();
        },
      ),
      
      // Create Video - recapvideo://create?url=https://youtube.com/...
      GoRoute(
        path: '/create',
        name: 'create',
        builder: (context, state) {
          // Pass URL from query param if present
          // final sourceUrl = state.uri.queryParameters['url'];
          return const MainNavigation(); // Will navigate to create tab
        },
      ),
      
      // Credits - recapvideo://credits
      GoRoute(
        path: '/credits',
        name: 'credits',
        builder: (context, state) => const MainNavigation(),
      ),
    ],
    
    // Error page
    errorBuilder: (context, state) => Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              'Page not found',
              style: const TextStyle(color: Colors.white, fontSize: 18),
            ),
            const SizedBox(height: 8),
            Text(
              '${state.uri}',
              style: const TextStyle(color: Colors.white54, fontSize: 12),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go('/home'),
              child: const Text('Go to Home'),
            ),
          ],
        ),
      ),
    ),
  );
});

/// Helper to generate deep links
class DeepLinkHelper {
  /// Generate video detail link
  static String videoLink(String videoId) => 
      '${DeepLinkConfig.scheme}://video/$videoId';
  
  /// Generate order detail link
  static String orderLink(String orderId) => 
      '${DeepLinkConfig.scheme}://order/$orderId';
  
  /// Generate create video link with optional URL
  static String createLink({String? sourceUrl}) {
    final base = '${DeepLinkConfig.scheme}://create';
    if (sourceUrl != null) {
      return '$base?url=${Uri.encodeComponent(sourceUrl)}';
    }
    return base;
  }
  
  /// Generate universal link for sharing
  static String universalVideoLink(String videoId) =>
      'https://${DeepLinkConfig.webHost}/video/$videoId';
}
