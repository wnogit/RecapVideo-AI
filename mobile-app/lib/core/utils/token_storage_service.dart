import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/user.dart';

/// Token Storage Service - Fully Encrypted using FlutterSecureStorage
/// 
/// Uses:
/// - Android: EncryptedSharedPreferences (AES encryption)
/// - iOS: Keychain
class TokenStorageService {
  // Android options for better reliability
  static const _androidOptions = AndroidOptions(
    encryptedSharedPreferences: true,
    resetOnError: true, // Reset storage if corrupted
  );
  
  static const _iosOptions = IOSOptions(
    accessibility: KeychainAccessibility.first_unlock_this_device,
  );
  
  static const _storage = FlutterSecureStorage(
    aOptions: _androidOptions,
    iOptions: _iosOptions,
  );
  
  // Keys
  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _userIdKey = 'user_id';
  static const String _userDataKey = 'cached_user_data'; // NEW: User cache
  
  /// Save access token (encrypted)
  Future<void> saveAccessToken(String token) async {
    debugPrint('💾 Saving access token securely (${token.length} chars)');
    await _storage.write(key: _accessTokenKey, value: token);
  }
  
  /// Get access token
  Future<String?> getAccessToken() async {
    try {
      final token = await _storage.read(key: _accessTokenKey);
      debugPrint('📖 Reading access token: ${token != null ? "found (${token.length} chars)" : "null"}');
      return token;
    } catch (e) {
      debugPrint('❌ Secure storage read error: $e');
      // If storage is corrupted, clear and return null
      await clearAll();
      return null;
    }
  }
  
  /// Save refresh token
  Future<void> saveRefreshToken(String token) async {
    await _storage.write(key: _refreshTokenKey, value: token);
  }
  
  /// Get refresh token
  Future<String?> getRefreshToken() async {
    try {
      return await _storage.read(key: _refreshTokenKey);
    } catch (e) {
      debugPrint('❌ Secure storage read error: $e');
      return null;
    }
  }
  
  /// Save user ID
  Future<void> saveUserId(String userId) async {
    await _storage.write(key: _userIdKey, value: userId);
  }
  
  /// Get user ID
  Future<String?> getUserId() async {
    try {
      return await _storage.read(key: _userIdKey);
    } catch (e) {
      return null;
    }
  }
  
  /// Save all auth data (encrypted)
  Future<void> saveAuthData({
    required String accessToken,
    String? refreshToken,
    String? userId,
  }) async {
    debugPrint('💾 Saving all auth data securely...');
    await saveAccessToken(accessToken);
    if (refreshToken != null) {
      await saveRefreshToken(refreshToken);
    }
    if (userId != null) {
      await saveUserId(userId);
    }
    debugPrint('✅ Auth data saved securely');
  }
  
  /// Clear all stored data
  Future<void> clearAll() async {
    debugPrint('🗑️ Clearing all secure auth data...');
    try {
      await _storage.deleteAll();
      debugPrint('✅ Secure auth data cleared');
    } catch (e) {
      debugPrint('❌ Error clearing secure storage: $e');
    }
  }
  
  /// Check if user is logged in (has access token)
  Future<bool> hasAccessToken() async {
    final token = await getAccessToken();
    return token != null && token.isNotEmpty;
  }
  
  // ===========================================
  // User Data Caching (for offline-first login)
  // ===========================================
  
  /// Save user data as JSON (for offline access)
  Future<void> saveUserData(User user) async {
    try {
      final jsonString = jsonEncode(user.toJson());
      await _storage.write(key: _userDataKey, value: jsonString);
      debugPrint('💾 Cached user data: ${user.email}');
    } catch (e) {
      debugPrint('❌ Error caching user data: $e');
    }
  }
  
  /// Get cached user data (offline-first)
  Future<User?> getCachedUser() async {
    try {
      final jsonString = await _storage.read(key: _userDataKey);
      if (jsonString == null || jsonString.isEmpty) {
        debugPrint('📖 No cached user data found');
        return null;
      }
      final jsonMap = jsonDecode(jsonString) as Map<String, dynamic>;
      final user = User.fromJson(jsonMap);
      debugPrint('📖 Loaded cached user: ${user.email}');
      return user;
    } catch (e) {
      debugPrint('❌ Error reading cached user: $e');
      return null;
    }
  }
  
  /// Clear cached user data
  Future<void> clearUserData() async {
    try {
      await _storage.delete(key: _userDataKey);
      debugPrint('🗑️ Cleared cached user data');
    } catch (e) {
      debugPrint('❌ Error clearing cached user: $e');
    }
  }
}


