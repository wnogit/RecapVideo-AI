import 'package:flutter/foundation.dart';\n\n/// App Configuration
/// 
/// Environment-based configuration for different build modes
/// 
/// Usage:
/// ```bash
/// # Development (default)
/// flutter run
/// 
/// # Production
/// flutter build apk --dart-define=PRODUCTION=true
/// 
/// # Staging
/// flutter build apk --dart-define=API_URL=https://staging.api.recapvideo.ai/api/v1
/// ```
class AppConfig {
  /// Is production build?
  static const bool isProduction = bool.fromEnvironment(
    'PRODUCTION',
    defaultValue: false,
  );
  
  /// API Base URL
  static const String apiBaseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'https://api.recapvideo.ai/api/v1',
  );
  
  /// Environment name
  static String get environment {
    if (isProduction) return 'production';
    if (apiBaseUrl.contains('staging')) return 'staging';
    return 'development';
  }
  
  /// App name based on environment
  static String get appName {
    if (isProduction) return 'RecapVideo.AI';
    if (environment == 'staging') return 'RecapVideo (Staging)';
    return 'RecapVideo (Dev)';
  }
  
  // ===== Feature Flags =====
  
  /// Enable analytics tracking
  static bool get enableAnalytics => isProduction;
  
  /// Enable crash reporting
  static bool get enableCrashReporting => isProduction;
  
  /// Show debug banner on app bar
  static bool get showDebugBanner => !isProduction;
  
  /// Enable SSL certificate pinning
  static bool get enableSSLPinning => isProduction;
  
  /// Enable device security checks (jailbreak/root detection)
  static bool get enableDeviceSecurity => isProduction;
  
  /// Show detailed error messages
  static bool get showDetailedErrors => !isProduction;
  
  /// Enable network request logging
  static bool get enableNetworkLogging => !isProduction;
  
  // ===== Timeouts =====
  
  /// API connection timeout
  static const Duration connectTimeout = Duration(seconds: 30);
  
  /// API receive timeout
  static const Duration receiveTimeout = Duration(seconds: 30);
  
  /// Video polling interval
  static const Duration videoPollingInterval = Duration(seconds: 5);
  
  /// Session timeout (auto-logout after inactivity)
  static const Duration sessionTimeout = Duration(hours: 24);
  
  // ===== Cache Settings =====
  
  /// Max cache size in MB
  static const int maxCacheSizeMB = 100;
  
  /// Cache expiry duration
  static const Duration cacheExpiry = Duration(days: 7);
  
  // ===== App Info =====
  
  /// App version (should match pubspec.yaml)
  static const String appVersion = '1.0.0';
  
  /// Build number
  static const String buildNumber = '1';
  
  /// Minimum supported backend API version
  static const String minApiVersion = '1.0';
  
  // ===== Contact Info =====
  
  static const String supportEmail = 'support@recapvideo.ai';
  static const String supportTelegram = '@recapvideo_support';
  static const String websiteUrl = 'https://recapvideo.ai';
  static const String privacyPolicyUrl = 'https://recapvideo.ai/privacy';
  static const String termsOfServiceUrl = 'https://recapvideo.ai/terms';
  
  // ===== Debug Info =====
  
  /// Print configuration for debugging
  static void printConfig() {
    if (kDebugMode) {
      debugPrint('========== App Configuration ==========');
      debugPrint('Environment: $environment');
      debugPrint('API URL: $apiBaseUrl');
      debugPrint('Version: $appVersion+$buildNumber');
      debugPrint('Analytics: $enableAnalytics');
      debugPrint('Crash Reporting: $enableCrashReporting');
      debugPrint('SSL Pinning: $enableSSLPinning');
      debugPrint('Device Security: $enableDeviceSecurity');
      debugPrint('========================================');
    }
  }
}
