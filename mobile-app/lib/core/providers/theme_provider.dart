import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Theme Mode Provider - Manages Light/Dark Theme Toggle
/// 
/// Usage:
/// ```dart
/// // Get current theme mode
/// final themeMode = ref.watch(themeModeProvider);
/// 
/// // Toggle theme
/// ref.read(themeModeProvider.notifier).toggleTheme();
/// 
/// // Set specific theme
/// ref.read(themeModeProvider.notifier).setThemeMode(ThemeMode.light);
/// ```

const String _themeModeKey = 'theme_mode';

/// Theme Mode State Notifier Provider
final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>((ref) {
  return ThemeModeNotifier();
});

class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  ThemeModeNotifier() : super(ThemeMode.dark) {
    _loadThemeMode();
  }

  /// Load theme mode from SharedPreferences
  Future<void> _loadThemeMode() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final themeModeString = prefs.getString(_themeModeKey);
      
      if (themeModeString != null) {
        state = _themeModeFromString(themeModeString);
      }
    } catch (e) {
      // Default to dark mode if loading fails
      state = ThemeMode.dark;
    }
  }

  /// Save theme mode to SharedPreferences
  Future<void> _saveThemeMode(ThemeMode mode) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_themeModeKey, mode.name);
    } catch (e) {
      debugPrint('Failed to save theme mode: $e');
    }
  }

  /// Toggle between light and dark theme
  Future<void> toggleTheme() async {
    if (state == ThemeMode.dark) {
      state = ThemeMode.light;
    } else {
      state = ThemeMode.dark;
    }
    await _saveThemeMode(state);
  }

  /// Set specific theme mode
  Future<void> setThemeMode(ThemeMode mode) async {
    if (state != mode) {
      state = mode;
      await _saveThemeMode(mode);
    }
  }

  /// Set theme based on system preference
  Future<void> setSystemTheme() async {
    state = ThemeMode.system;
    await _saveThemeMode(state);
  }

  /// Check if current theme is dark
  bool get isDarkMode => state == ThemeMode.dark;
  
  /// Check if using system theme
  bool get isSystemTheme => state == ThemeMode.system;

  ThemeMode _themeModeFromString(String value) {
    switch (value) {
      case 'light':
        return ThemeMode.light;
      case 'system':
        return ThemeMode.system;
      case 'dark':
      default:
        return ThemeMode.dark;
    }
  }
}

/// Extension for easy theme mode checking in widgets
extension ThemeModeExtension on ThemeMode {
  bool get isDark => this == ThemeMode.dark;
  bool get isLight => this == ThemeMode.light;
  bool get isSystem => this == ThemeMode.system;
  
  String get displayName {
    switch (this) {
      case ThemeMode.light:
        return 'Light';
      case ThemeMode.dark:
        return 'Dark';
      case ThemeMode.system:
        return 'System';
    }
  }
  
  String get displayNameMM {
    switch (this) {
      case ThemeMode.light:
        return 'အလင်း';
      case ThemeMode.dark:
        return 'အမှောင်';
      case ThemeMode.system:
        return 'စနစ်အတိုင်း';
    }
  }
  
  IconData get icon {
    switch (this) {
      case ThemeMode.light:
        return Icons.light_mode;
      case ThemeMode.dark:
        return Icons.dark_mode;
      case ThemeMode.system:
        return Icons.settings_brightness;
    }
  }
}
