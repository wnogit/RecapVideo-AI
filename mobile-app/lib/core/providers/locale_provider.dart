import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Locale/Language Provider - Manages English/Burmese Language Toggle
/// 
/// Supported Languages:
/// - English (en)
/// - Burmese (my)
/// 
/// Usage:
/// ```dart
/// // Get current locale
/// final locale = ref.watch(localeProvider);
/// 
/// // Change language
/// ref.read(localeProvider.notifier).setLocale(const Locale('my'));
/// 
/// // Toggle language
/// ref.read(localeProvider.notifier).toggleLocale();
/// ```

const String _localeKey = 'app_locale';

/// Supported locales
class AppLocales {
  static const Locale english = Locale('en');
  static const Locale burmese = Locale('my');
  
  static const List<Locale> supportedLocales = [english, burmese];
  
  static String getLanguageName(Locale locale) {
    switch (locale.languageCode) {
      case 'en':
        return 'English';
      case 'my':
        return 'မြန်မာ';
      default:
        return 'English';
    }
  }
  
  static String getLanguageNameInEnglish(Locale locale) {
    switch (locale.languageCode) {
      case 'en':
        return 'English';
      case 'my':
        return 'Burmese';
      default:
        return 'English';
    }
  }
  
  static String getFlagEmoji(Locale locale) {
    switch (locale.languageCode) {
      case 'en':
        return '🇺🇸';
      case 'my':
        return '🇲🇲';
      default:
        return '🇺🇸';
    }
  }
}

/// Locale State Notifier Provider
final localeProvider = StateNotifierProvider<LocaleNotifier, Locale>((ref) {
  return LocaleNotifier();
});

class LocaleNotifier extends StateNotifier<Locale> {
  LocaleNotifier() : super(AppLocales.english) {
    _loadLocale();
  }

  /// Load locale from SharedPreferences
  Future<void> _loadLocale() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final localeCode = prefs.getString(_localeKey);
      
      if (localeCode != null) {
        state = Locale(localeCode);
      }
    } catch (e) {
      // Default to English if loading fails
      state = AppLocales.english;
    }
  }

  /// Save locale to SharedPreferences
  Future<void> _saveLocale(Locale locale) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_localeKey, locale.languageCode);
    } catch (e) {
      debugPrint('Failed to save locale: $e');
    }
  }

  /// Set specific locale
  Future<void> setLocale(Locale locale) async {
    if (state != locale && AppLocales.supportedLocales.contains(locale)) {
      state = locale;
      await _saveLocale(locale);
    }
  }

  /// Toggle between English and Burmese
  Future<void> toggleLocale() async {
    if (state.languageCode == 'en') {
      state = AppLocales.burmese;
    } else {
      state = AppLocales.english;
    }
    await _saveLocale(state);
  }

  /// Check if current locale is English
  bool get isEnglish => state.languageCode == 'en';
  
  /// Check if current locale is Burmese
  bool get isBurmese => state.languageCode == 'my';
  
  /// Get current language name
  String get currentLanguageName => AppLocales.getLanguageName(state);
  
  /// Get current flag emoji
  String get currentFlag => AppLocales.getFlagEmoji(state);
}

/// Extension for Locale
extension LocaleExtension on Locale {
  bool get isEnglish => languageCode == 'en';
  bool get isBurmese => languageCode == 'my';
  
  String get displayName => AppLocales.getLanguageName(this);
  String get displayNameEnglish => AppLocales.getLanguageNameInEnglish(this);
  String get flag => AppLocales.getFlagEmoji(this);
}
