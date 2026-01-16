import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Supported Languages
enum AppLanguage {
  english('en', 'English', '🇺🇸'),
  myanmar('my', 'မြန်မာ', '🇲🇲');

  final String code;
  final String label;
  final String flag;
  const AppLanguage(this.code, this.label, this.flag);
}

/// Language Provider
class LanguageNotifier extends StateNotifier<AppLanguage> {
  static const _key = 'app_language';

  LanguageNotifier() : super(AppLanguage.myanmar) {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final code = prefs.getString(_key);
    if (code != null) {
      state = AppLanguage.values.firstWhere(
        (l) => l.code == code,
        orElse: () => AppLanguage.myanmar,
      );
    }
  }

  Future<void> setLanguage(AppLanguage language) async {
    state = language;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, language.code);
  }

  Locale get locale => Locale(state.code);
}

/// Language Provider
final languageProvider = StateNotifierProvider<LanguageNotifier, AppLanguage>((ref) {
  return LanguageNotifier();
});

/// Localization Strings
class AppStrings {
  final AppLanguage language;

  AppStrings(this.language);

  // Common
  String get appName => language == AppLanguage.english ? 'RecapVideo.AI' : 'RecapVideo.AI';
  String get settings => language == AppLanguage.english ? 'Settings' : 'ဆက်တင်များ';
  String get language_ => language == AppLanguage.english ? 'Language' : 'ဘာသာစကား';
  String get theme => language == AppLanguage.english ? 'Theme' : 'အပြင်အဆင်';
  String get light => language == AppLanguage.english ? 'Light' : 'အလင်း';
  String get dark => language == AppLanguage.english ? 'Dark' : 'မှောင်';
  String get system => language == AppLanguage.english ? 'System' : 'System';
  String get logout => language == AppLanguage.english ? 'Logout' : 'ထွက်မည်';
  
  // Home
  String get home => language == AppLanguage.english ? 'Home' : 'ပင်မ';
  String get videos => language == AppLanguage.english ? 'Videos' : 'ဗီဒီယိုများ';
  String get create => language == AppLanguage.english ? 'Create' : 'ဖန်တီး';
  String get credits => language == AppLanguage.english ? 'Credits' : 'ခရက်ဒစ်';
  String get profile => language == AppLanguage.english ? 'Profile' : 'ပရိုဖိုင်';

  // Video Creation
  String get step1 => language == AppLanguage.english ? 'Source & Voice' : 'ရင်းမြစ်နှင့် အသံ';
  String get step2 => language == AppLanguage.english ? 'Styles' : 'စတိုင်များ';
  String get step3 => language == AppLanguage.english ? 'Branding' : 'အမှတ်တံဆိပ်';
  String get next => language == AppLanguage.english ? 'Next' : 'ရှေ့သို့';
  String get back => language == AppLanguage.english ? 'Back' : 'နောက်သို့';
  String get createVideo => language == AppLanguage.english ? 'Create Video' : 'ဗီဒီယို ဖန်တီးမည်';

  // Processing
  String get processing => language == AppLanguage.english ? 'Processing...' : 'လုပ်ဆောင်နေသည်...';
  String get pending => language == AppLanguage.english ? 'Pending' : 'စောင့်ဆိုင်းနေသည်';
  String get extracting => language == AppLanguage.english ? 'Analyzing video' : 'Video လေ့လာနေသည်';
  String get generatingScript => language == AppLanguage.english ? 'Writing script' : 'Script ရေးနေသည်';
  String get generatingAudio => language == AppLanguage.english ? 'Recording audio' : 'အသံသွင်းနေသည်';
  String get rendering => language == AppLanguage.english ? 'Rendering' : 'ပြင်ဆင်နေသည်';
  String get uploading => language == AppLanguage.english ? 'Almost done' : 'မကြာခင် ပြီးပါပြီ';
  String get completed => language == AppLanguage.english ? 'Completed!' : 'ပြီးပါပြီ!';
  String get failed => language == AppLanguage.english ? 'Failed' : 'မအောင်မြင်ပါ';
  String get cancel => language == AppLanguage.english ? 'Cancel' : 'ဖျက်သိမ်းမည်';
}

/// Strings provider
final stringsProvider = Provider<AppStrings>((ref) {
  final lang = ref.watch(languageProvider);
  return AppStrings(lang);
});
