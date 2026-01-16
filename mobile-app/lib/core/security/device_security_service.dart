// TODO: Uncomment when packages are fixed
// import 'package:flutter_jailbreak_detection/flutter_jailbreak_detection.dart';
// import 'package:safe_device/safe_device.dart';
import 'package:flutter/foundation.dart';

/// Device Security Service - Device လုံခြုံမှု စစ်ဆေးရန်
class DeviceSecurityService {
  /// Device သည် လုံခြုံမှုရှိမရှိ စစ်ဆေးမယ်
  /// Returns: DeviceSecurityResult with security status
  /// NOTE: Jailbreak detection packages temporarily disabled
  static Future<DeviceSecurityResult> checkDeviceSecurity() async {
    try {
      // Debug mode မှာ bypass
      if (kDebugMode) {
        return DeviceSecurityResult(
          isSafe: true,
          isJailbroken: false,
          isRooted: false,
          isRealDevice: true,
          canMockLocation: false,
          isOnExternalStorage: false,
          isDevelopmentModeEnable: true,
          message: 'Debug mode - security check skipped',
        );
      }

      // TODO: Enable when security packages are fixed
      // Production အတွက် security checks ပြန်ဖွင့်ရမယ်
      /*
      final isJailbroken = await FlutterJailbreakDetection.jailbroken;
      final isDeveloperMode = await FlutterJailbreakDetection.developerMode;
      final isRealDevice = await SafeDevice.isRealDevice;
      final canMockLocation = await SafeDevice.canMockLocation;
      final isOnExternalStorage = await SafeDevice.isOnExternalStorage;
      */
      
      // Temporarily return safe result
      return DeviceSecurityResult(
        isSafe: true,
        isJailbroken: false,
        isRooted: false,
        isRealDevice: true,
        canMockLocation: false,
        isOnExternalStorage: false,
        isDevelopmentModeEnable: false,
        message: 'Security packages pending - check bypassed',
      );
    } catch (e) {
      debugPrint('⚠️ Security check failed: $e');
      return DeviceSecurityResult(
        isSafe: true,
        isJailbroken: false,
        isRooted: false,
        isRealDevice: true,
        canMockLocation: false,
        isOnExternalStorage: false,
        isDevelopmentModeEnable: false,
        message: 'Security check failed: $e',
      );
    }
  }
}

/// Device Security Check Result
class DeviceSecurityResult {
  final bool isSafe;
  final bool isJailbroken;
  final bool isRooted;
  final bool isRealDevice;
  final bool canMockLocation;
  final bool isOnExternalStorage;
  final bool isDevelopmentModeEnable;
  final String message;

  DeviceSecurityResult({
    required this.isSafe,
    required this.isJailbroken,
    required this.isRooted,
    required this.isRealDevice,
    required this.canMockLocation,
    required this.isOnExternalStorage,
    required this.isDevelopmentModeEnable,
    required this.message,
  });

  @override
  String toString() => 'DeviceSecurityResult(isSafe: $isSafe, message: $message)';
}
