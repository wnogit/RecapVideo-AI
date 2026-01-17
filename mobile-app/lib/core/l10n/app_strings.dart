import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/locale_provider.dart';

/// App Strings - Centralized Localization
/// 
/// All user-facing strings are stored here with English and Burmese translations.
/// 
/// Usage:
/// ```dart
/// // In widget
/// final strings = ref.watch(stringsProvider);
/// Text(strings.home);
/// 
/// // Or with extension
/// context.strings.home
/// ```

/// Strings Provider
final stringsProvider = Provider<AppStrings>((ref) {
  final locale = ref.watch(localeProvider);
  return AppStrings(locale);
});

/// BuildContext extension for easy access
extension StringsContext on BuildContext {
  AppStrings get strings => ProviderScope.containerOf(this).read(stringsProvider);
}

/// App Strings Class
class AppStrings {
  final Locale locale;
  
  AppStrings(this.locale);
  
  bool get isEnglish => locale.languageCode == 'en';
  
  // Helper to get localized string
  String _get(String en, String my) => isEnglish ? en : my;

  // ============================================
  // COMMON
  // ============================================
  String get appName => 'RecapVideo.AI';
  String get appTagline => _get('AI Video Creation', 'AI ဗီဒီယို ဖန်တီးရေး');
  String get loading => _get('Loading...', 'ဖွင့်နေသည်...');
  String get error => _get('Error', 'အမှား');
  String get success => _get('Success', 'အောင်မြင်သည်');
  String get cancel => _get('Cancel', 'မလုပ်တော့');
  String get confirm => _get('Confirm', 'အတည်ပြု');
  String get save => _get('Save', 'သိမ်းမည်');
  String get delete => _get('Delete', 'ဖျက်မည်');
  String get edit => _get('Edit', 'ပြင်မည်');
  String get done => _get('Done', 'ပြီးပြီ');
  String get next => _get('Next', 'ရှေ့သို့');
  String get back => _get('Back', 'နောက်သို့');
  String get close => _get('Close', 'ပိတ်မည်');
  String get ok => _get('OK', 'အိုကေ');
  String get yes => _get('Yes', 'ဟုတ်ကဲ့');
  String get no => _get('No', 'မဟုတ်');
  String get retry => _get('Retry', 'ထပ်ကြိုးစား');
  String get search => _get('Search', 'ရှာဖွေရန်');
  String get noData => _get('No data', 'ဒေတာမရှိပါ');
  String get optional => _get('Optional', 'ထည့်လည်းရ');

  // ============================================
  // NAVIGATION
  // ============================================
  String get home => _get('Home', 'ပင်မ');
  String get videos => _get('Videos', 'ဗီဒီယိုများ');
  String get create => _get('Create', 'ဖန်တီးရန်');
  String get credits => _get('Credits', 'ခရက်ဒစ်');
  String get profile => _get('Profile', 'ပရိုဖိုင်');

  // ============================================
  // AUTH
  // ============================================
  String get login => _get('Login', 'ဝင်မည်');
  String get logout => _get('Logout', 'ထွက်မည်');
  String get logoutConfirm => _get('Are you sure you want to logout?', 'ထွက်မည်မှာ သေချာပါသလား?');
  String get register => _get('Register', 'မှတ်ပုံတင်မည်');
  String get email => _get('Email', 'အီးမေးလ်');
  String get password => _get('Password', 'စကားဝှက်');
  String get confirmPassword => _get('Confirm Password', 'စကားဝှက် အတည်ပြု');
  String get forgotPassword => _get('Forgot Password?', 'စကားဝှက် မေ့နေသလား?');
  String get resetPassword => _get('Reset Password', 'စကားဝှက် ပြန်သတ်မှတ်ရန်');
  String get createAccount => _get('Create Account', 'အကောင့်ဖွင့်မည်');
  String get alreadyHaveAccount => _get('Already have an account?', 'အကောင့်ရှိပြီးသားလား?');
  String get dontHaveAccount => _get("Don't have an account?", 'အကောင့်မရှိသေးဘူးလား?');
  String get fullName => _get('Full Name', 'အမည်အပြည့်အစုံ');
  String get enterEmail => _get('Enter your email', 'သင့်အီးမေးလ် ထည့်ပါ');
  String get enterPassword => _get('Enter your password', 'သင့်စကားဝှက် ထည့်ပါ');
  String get invalidEmail => _get('Invalid email address', 'မှားနေသော အီးမေးလ်');
  String get passwordTooShort => _get('Password must be at least 8 characters', 'စကားဝှက် အနည်းဆုံး စာလုံး ၈ လုံးရှိရမည်');
  String get passwordsDoNotMatch => _get('Passwords do not match', 'စကားဝှက်များ မတူညီပါ');
  String get loginSuccess => _get('Login successful', 'အောင်မြင်စွာ ဝင်ရောက်ပြီး');
  String get registerSuccess => _get('Registration successful', 'အောင်မြင်စွာ မှတ်ပုံတင်ပြီး');

  // ============================================
  // HOME SCREEN
  // ============================================
  String get welcome => _get('Welcome', 'ကြိုဆိုပါတယ်');
  String get welcomeBack => _get('Welcome Back', 'ပြန်လည် ကြိုဆိုပါတယ်');
  String get creditBalance => _get('Credit Balance', 'ခရက်ဒစ် လက်ကျန်');
  String get myOrders => _get('My Orders', 'ကျွန်ုပ်၏ အော်ဒါများ');
  String get processing => _get('Processing', 'လုပ်ဆောင်နေဆဲ');
  String get completed => _get('Completed', 'ပြီးဆုံးပြီး');
  String get failed => _get('Failed', 'မအောင်မြင်');
  String get recentVideos => _get('Recent Videos', 'မကြာသေးခင်က ဗီဒီယိုများ');
  String get viewAll => _get('View All', 'အားလုံးကြည့်ရန်');
  String get createFirstVideo => _get('Create your first video!', 'သင့်ပထမဆုံး ဗီဒီယို ဖန်တီးပါ!');
  String get getStarted => _get('Get Started', 'စတင်ရန်');
  String get pullToRefresh => _get('Pull to refresh', 'ပြန်လည်ရယူရန် ဆွဲပါ');

  // ============================================
  // VIDEO CREATION
  // ============================================
  String get createVideo => _get('Create Video', 'ဗီဒီယို ဖန်တီးရန်');
  String get step1Content => _get('Step 1: Content', 'အဆင့် ၁: အကြောင်းအရာ');
  String get step2Styles => _get('Step 2: Styles', 'အဆင့် ၂: ပုံစံများ');
  String get step3Branding => _get('Step 3: Branding', 'အဆင့် ၃: ကိုယ်ပိုင်တံဆိပ်');
  String get youtubeUrl => _get('YouTube URL', 'YouTube လင့်');
  String get enterYoutubeUrl => _get('Enter YouTube video URL', 'YouTube ဗီဒီယို URL ထည့်ပါ');
  String get invalidYoutubeUrl => _get('Invalid YouTube URL', 'မှားနေသော YouTube URL');
  String get voiceStyle => _get('Voice Style', 'အသံ စတိုင်');
  String get language => _get('Language', 'ဘာသာစကား');
  String get subtitles => _get('Subtitles', 'စာတန်းထိုး');
  String get enableSubtitles => _get('Enable Subtitles', 'စာတန်းထိုး ထည့်မည်');
  String get aspectRatio => _get('Aspect Ratio', 'ဗီဒီယို အချိုး');
  String get portrait => _get('Portrait', 'ဒေါင်လိုက်');
  String get landscape => _get('Landscape', 'အလျားလိုက်');
  String get square => _get('Square', 'စတုရန်း');
  String get logo => _get('Logo', 'လိုဂို');
  String get enableLogo => _get('Enable Logo', 'လိုဂို ထည့်မည်');
  String get selectLogo => _get('Tap to select logo', 'လိုဂို ရွေးရန် နှိပ်ပါ');
  String get logoPosition => _get('Logo Position', 'လိုဂို တည်နေရာ');
  String get topLeft => _get('Top Left', 'ဘယ်အပေါ်');
  String get topRight => _get('Top Right', 'ညာအပေါ်');
  String get bottomLeft => _get('Bottom Left', 'ဘယ်အောက်');
  String get bottomRight => _get('Bottom Right', 'ညာအောက်');
  String get logoSize => _get('Logo Size', 'လိုဂို အရွယ်အစား');
  String get small => _get('Small', 'သေး');
  String get medium => _get('Medium', 'လတ်');
  String get large => _get('Large', 'ကြီး');
  String get opacity => _get('Opacity', 'အလင်းပိတ်မှု');
  String get outro => _get('Outro', 'အဆုံးပိုင်း');
  String get enableOutro => _get('Enable Outro', 'Outro ထည့်မည်');
  String get outroText => _get('Add your channel info at the end', 'Video အဆုံးမှာ channel info ထည့်မည်');
  String get platform => _get('Platform', 'ပလက်ဖောင်း');
  String get branding => _get('Branding', 'ကိုယ်ပိုင်တံဆိပ်');
  String get brandingSubtitle => _get('Add your logo and outro', 'သင့် Logo နှင့် Outro ထည့်ပါ');
  String get estimatedCredits => _get('Estimated Credits', 'ခန့်မှန်း ခရက်ဒစ်');
  String get createNow => _get('Create Now', 'ယခု ဖန်တီးမည်');
  String get creating => _get('Creating...', 'ဖန်တီးနေသည်...');
  String get videoCreated => _get('Video creation started!', 'ဗီဒီယို ဖန်တီးမှု စတင်ပြီ!');
  String get insufficientCredits => _get('Insufficient credits', 'ခရက်ဒစ် မလုံလောက်ပါ');
  String get buyCredits => _get('Buy Credits', 'ခရက်ဒစ် ဝယ်ရန်');

  // ============================================
  // VIDEOS SCREEN
  // ============================================
  String get myVideos => _get('My Videos', 'ကျွန်ုပ်၏ ဗီဒီယိုများ');
  String get all => _get('All', 'အားလုံး');
  String get noVideosYet => _get('No videos yet', 'ဗီဒီယို မရှိသေးပါ');
  String get noVideosDescription => _get('Start creating amazing videos now!', 'အံ့သြဖွယ် ဗီဒီယိုများ ဖန်တီးပါ!');
  String get download => _get('Download', 'ဒေါင်းလုပ်');
  String get share => _get('Share', 'မျှဝေမည်');
  String get deleteVideo => _get('Delete Video', 'ဗီဒီယို ဖျက်မည်');
  String get deleteVideoConfirm => _get('Are you sure you want to delete this video?', 'ဒီဗီဒီယိုကို ဖျက်မည်မှာ သေချာပါသလား?');
  String get videoDeleted => _get('Video deleted', 'ဗီဒီယို ဖျက်ပြီး');
  String get downloading => _get('Downloading...', 'ဒေါင်းလုပ်နေသည်...');
  String get downloadComplete => _get('Download complete', 'ဒေါင်းလုပ် ပြီးပြီ');
  String get downloadFailed => _get('Download failed', 'ဒေါင်းလုပ် မအောင်မြင်');
  String get processingVideo => _get('Processing video...', 'ဗီဒီယို ပြုလုပ်နေသည်...');
  String get videoReady => _get('Video is ready!', 'ဗီဒီယို အဆင်သင့်ဖြစ်ပြီ!');

  // ============================================
  // CREDITS SCREEN
  // ============================================
  String get buyMoreCredits => _get('Buy More Credits', 'ခရက်ဒစ် ထပ်ဝယ်ရန်');
  String get currentBalance => _get('Current Balance', 'လက်ရှိ လက်ကျန်');
  String get selectPackage => _get('Select a Package', 'ပက်ကေ့ချ် ရွေးပါ');
  String get popular => _get('POPULAR', 'လူကြိုက်များ');
  String get bestValue => _get('BEST VALUE', 'အကောင်းဆုံး တန်ဖိုး');
  String get paymentMethod => _get('Payment Method', 'ငွေပေးချေမှု နည်းလမ်း');
  String get kbzPay => _get('KBZ Pay', 'KBZ Pay');
  String get wavePay => _get('Wave Pay', 'Wave Pay');
  String get ayaPay => _get('AYA Pay', 'AYA Pay');
  String get bankTransfer => _get('Bank Transfer', 'ဘဏ်လွှဲ');
  String get proceed => _get('Proceed', 'ဆက်လက်ဆောင်ရွက်ရန်');
  String get paymentSuccess => _get('Payment successful!', 'ငွေပေးချေမှု အောင်မြင်ပြီ!');
  String get paymentFailed => _get('Payment failed', 'ငွေပေးချေမှု မအောင်မြင်');
  String get creditsAdded => _get('Credits added to your account', 'ခရက်ဒစ် သင့်အကောင့်သို့ ထည့်ပြီး');

  // ============================================
  // PROFILE SCREEN
  // ============================================
  String get editProfile => _get('Edit Profile', 'ပရိုဖိုင် ပြင်ရန်');
  String get orderHistory => _get('Order History', 'အော်ဒါ မှတ်တမ်း');
  String get transactionHistory => _get('Transaction History', 'ငွေလွှဲ မှတ်တမ်း');
  String get helpSupport => _get('Help & Support', 'အကူအညီ');
  String get settings => _get('Settings', 'ဆက်တင်များ');
  String get about => _get('About', 'အကြောင်း');
  String get version => _get('Version', 'ဗားရှင်း');
  String get memberSince => _get('Member since', 'အဖွဲ့ဝင်ဖြစ်သည်မှာ');
  String get pro => _get('PRO', 'PRO');
  String get free => _get('FREE', 'FREE');
  String get changeAvatar => _get('Change Avatar', 'ပရိုဖိုင်ပုံ ပြောင်းရန်');
  String get camera => _get('Camera', 'ကင်မရာ');
  String get gallery => _get('Gallery', 'ဓာတ်ပုံများ');
  String get menu => _get('Menu', 'မီနူး');
  String get avatarUpdated => _get('Avatar updated!', 'ပရိုဖိုင်ပုံ ပြောင်းပြီး!');
  String get removePhoto => _get('Remove Photo', 'ဓာတ်ပုံ ဖယ်ရန်');
  String get logoutConfirmation => _get('Are you sure you want to logout?', 'ထွက်မည်မှာ သေချာပါသလား?');
  String get unknown => _get('Unknown', 'မသိ');
  String get continueButton => _get('Continue', 'ဆက်လုပ်မည်');
  String get confirmation => _get('Confirmation', 'အတည်ပြုခြင်း');
  String get copy => _get('Copy', 'ကူးယူ');
  String get copied => _get('Copied', 'ကူးယူပြီး');
  String get orderSummary => _get('Order Summary', 'အော်ဒါ အကျဉ်းချုပ်');
  String get package => _get('Package', 'ပက်ကေ့ချ်');
  String get price => _get('Price', 'စျေးနှုန်း');
  String get payment => _get('Payment', 'ငွေပေးချေမှု');
  String get transactionIdLabel => _get('Transaction ID (last 7 digits)', 'ငွေလွှဲ ID (နောက်ဆုံး ၇ လုံး)');
  String get uploadScreenshot => _get('Upload Screenshot', 'Screenshot တင်ရန်');
  String get submit => _get('Submit', 'တင်သွင်းမည်');
  String get orderSubmitted => _get("Order submitted! We'll review it soon.", 'အော်ဒါ တင်ပြီးပါပြီ! စစ်ဆေးပေးပါမည်။');
  String get orderInstructions => _get('Order Instructions', 'မှာဝယ်ရန် အဆင့် ၃ ဆင့်');
  String get orderStep1 => _get('1. Select package and amount', '၁။ မှာဝယ်မည့် ပက်ကေ့ နှင့် ငွေပမာဏ ရွေးချယ်ပါ');
  String get orderStep2 => _get('2. Select payment account and transfer to selected account only', '၂။ ငွေလွှဲမည့် အကောင့်ကို ရွေးချယ်ပြီး ရွေးချယ်ထားသော အကောင့်ကိုသာ ငွေလွှဲရပါမည်');
  String get orderStep3 => _get('3. After transfer, enter last 7 digits of Transaction ID and upload screenshot', '၃။ ငွေလွှဲပြီးမှ Transaction ID နောက်ဆုံး ၇ လုံး နှင့် Screenshot ကို ပူးတွဲတင်ပါ');
  String get orderProcessingTime => _get('Processing time: 3-30 minutes', 'ကြာချိန် ၃ မိနစ်မှ ၃၀ အထိ ကြာနိုင်ပါသည်');
  String get failedToLoad => _get('Failed to load', 'ဖွင့်ရန် မအောင်မြင်ပါ');

  // ============================================
  // SETTINGS SCREEN
  // ============================================
  String get notifications => _get('Notifications', 'အကြောင်းကြားချက်များ');
  String get pushNotifications => _get('Push Notifications', 'Push အကြောင်းကြားချက်');
  String get pushNotificationsDesc => _get('Video completion alerts', 'ဗီဒီယို ပြီးဆုံးကြောင်း အကြောင်းကြား');
  String get emailNotifications => _get('Email Notifications', 'အီးမေးလ် အကြောင်းကြားချက်');
  String get emailNotificationsDesc => _get('Weekly summary', 'အပတ်စဉ် အကျဉ်းချုပ်');
  String get appLanguage => _get('App Language', 'အက်ပ် ဘာသာစကား');
  String get defaultVideoLanguage => _get('Default Video Language', 'ပုံသေ ဗီဒီယို ဘာသာစကား');
  String get videoSettings => _get('Video Settings', 'ဗီဒီယို ဆက်တင်');
  String get defaultVideoQuality => _get('Default Video Quality', 'ပုံသေ ဗီဒီယို အရည်အသွေး');
  String get autoDownload => _get('Auto-Download Completed Videos', 'ပြီးသော ဗီဒီယိုများ အလိုအလျောက် ဒေါင်းလုပ်');
  String get autoDownloadDesc => _get('Download when on WiFi', 'WiFi ဖြင့် ဒေါင်းလုပ်');
  String get storage => _get('Storage', 'သိုလှောင်မှု');
  String get cacheSize => _get('Cache Size', 'Cache အရွယ်အစား');
  String get clearCache => _get('Clear Cache', 'Cache ရှင်းရန်');
  String get cacheCleared => _get('Cache cleared', 'Cache ရှင်းပြီး');
  String get theme => _get('Theme', 'အပြင်အဆင်');
  String get darkMode => _get('Dark Mode', 'အမှောင်');
  String get lightMode => _get('Light Mode', 'အလင်း');
  String get systemDefault => _get('System Default', 'စနစ်အတိုင်း');
  String get termsOfService => _get('Terms of Service', 'ဝန်ဆောင်မှု စည်းမျဉ်း');
  String get privacyPolicy => _get('Privacy Policy', 'ကိုယ်ရေးအချက်အလက် မူဝါဒ');

  // ============================================
  // HELP SCREEN
  // ============================================
  String get faqs => _get('FAQs', 'မေးလေ့ရှိသော မေးခွန်းများ');
  String get contactUs => _get('Contact Us', 'ဆက်သွယ်ရန်');
  String get telegram => _get('Telegram', 'Telegram');
  String get website => _get('Website', 'ဝက်ဘ်ဆိုက်');
  String get reportIssue => _get('Report an Issue', 'ပြဿနာ တင်ပြရန်');
  String get quickTips => _get('Quick Tips', 'အကြံပြုချက်များ');
  String get needHelp => _get('Need Help?', 'အကူအညီ လိုပါသလား?');
  String get helpDescription => _get('Contact our support team 24/7', 'ကျွန်ုပ်တို့၏ ပံ့ပိုးရေးအဖွဲ့ကို ၂၄ နာရီ ဆက်သွယ်နိုင်ပါသည်');
  
  // FAQ Questions
  String get faq1Question => _get('How long does video creation take?', 'ဗီဒီယို ဖန်တီးရန် ဘယ်လောက်ကြာသလဲ?');
  String get faq1Answer => _get('Usually 3-5 minutes depending on video length', 'ပုံမှန် ၃-၅ မိနစ်ကြာပါတယ်');
  String get faq2Question => _get('How to buy credits?', 'ခရက်ဒစ် ဘယ်လိုဝယ်ရမလဲ?');
  String get faq2Answer => _get('Go to Credits tab and select a package', 'Credits tab မှာ package ရွေးပြီးဝယ်ပါ');
  String get faq3Question => _get('Can I get a refund?', 'Refund ရနိုင်သလား?');
  String get faq3Answer => _get('Yes, if processing is not complete', 'Processing မပြီးသေးရင် refund ရနိုင်ပါတယ်');
  String get faq4Question => _get('Which video formats are supported?', 'ဘယ် Video format တွေ ပံ့ပိုးသလဲ?');
  String get faq4Answer => _get('We support MP4, WebM formats', 'MP4, WebM format တွေ ပံ့ပိုးပါတယ်');
  String get faq5Question => _get('How to contact support?', 'Support ကို ဘယ်လိုဆက်သွယ်ရမလဲ?');
  String get faq5Answer => _get('Use Telegram or email below', 'Telegram သို့မဟုတ် အောက်ပါ email သုံးပါ');

  // ============================================
  // ERRORS
  // ============================================
  String get networkError => _get('Network error. Please check your connection.', 'ကွန်ရက် အမှား။ သင့်ချိတ်ဆက်မှုကို စစ်ဆေးပါ။');
  String get serverError => _get('Server error. Please try again later.', 'ဆာဗာ အမှား။ နောက်မှ ထပ်ကြိုးစားပါ။');
  String get sessionExpired => _get('Session expired. Please login again.', 'Session ကုန်သွားပြီ။ ပြန်လည် ဝင်ရောက်ပါ။');
  String get somethingWentWrong => _get('Something went wrong', 'တစ်ခုခု မှားသွားပါပြီ');
  String get tryAgain => _get('Try Again', 'ထပ်ကြိုးစားပါ');

  // ============================================
  // VALIDATION
  // ============================================
  String get fieldRequired => _get('This field is required', 'ဒီနေရာ ဖြည့်ရန် လိုအပ်ပါသည်');
  String get emailRequired => _get('Email is required', 'အီးမေးလ် လိုအပ်ပါသည်');
  String get passwordRequired => _get('Password is required', 'စကားဝှက် လိုအပ်ပါသည်');
  String get nameRequired => _get('Name is required', 'အမည် လိုအပ်ပါသည်');
  String get urlRequired => _get('URL is required', 'URL လိုအပ်ပါသည်');

  // ============================================
  // VIDEO CREATION - STEP 1
  // ============================================
  String get videoDetails => _get('Video Details', 'ဗီဒီယို အချက်အလက်');
  String get videoDetailsDesc => _get('Enter YouTube Shorts URL and select voice', 'YouTube Shorts URL ထည့်ပြီး အသံ ရွေးချယ်ပါ');
  String get youtubeShortUrl => _get('YouTube Shorts URL', 'YouTube Shorts URL');
  String get selectVoice => _get('Select Voice', 'အသံ ရွေးချယ်ပါ');
  String get selectLanguageDesc => _get('Select the language for video translation', 'Video ကို ဘာသာပြန်မည့် ဘာသာစကား ရွေးချယ်ပါ');
  String get femaleVoice => _get('Female', 'အမျိုးသမီး');
  String get maleVoice => _get('Male', 'အမျိုးသား');
  String get voiceNameFemale => _get('Ma Ma', 'မမ');
  String get voiceNameMale => _get('Mg Lay', 'မောင်လေး');
  String get videoFormat => _get('Video Format', 'ဗီဒီယို ဖော်မက်');
  String get popularLabel => _get('Popular', 'လူကြိုက်များ');
  String get preview => _get('Preview', 'ကြိုကြည့်ရန်');
  String get formatVerticalDesc => _get('Recommended for TikTok/Shorts', 'TikTok/Shorts အတွက် အကြံပြုပါတယ်');
  String get formatHorizontalDesc => _get('Recommended for YouTube/Landscape', 'YouTube/Landscape ဗီဒီယို အတွက် အကြံပြုပါတယ်');
  String get formatSquareDesc => _get('Recommended for Instagram/Facebook Post', 'Instagram/Facebook Post အတွက် အကြံပြုပါတယ်');
  String get formatPortraitDesc => _get('Recommended for Instagram Portrait Feed', 'Instagram Portrait Feed အတွက် အကြံပြုပါတယ်');

  // ============================================
  // VIDEO CREATION - STEP 2
  // ============================================
  String get videoStyles => _get('Video Styles', 'ဗီဒီယို စတိုင်');
  String get videoStylesDesc => _get('Select copyright protection, subtitles and logo', 'Copyright ကာကွယ်ခြင်း၊ စာတန်း နှင့် Logo ရွေးချယ်ပါ');
  String get copyrightProtection => _get('Copyright Protection', 'Copyright ကာကွယ်ခြင်း');
  String get copyrightProtectionDesc => _get('Modify video to protect from copyright', 'Video ကို ပိုဒ်အပ်ပြောင်းလဲ၍ ကာကွယ်ပါ');
  String get customBlur => _get('Custom Blur', 'Custom Blur');
  String get customBlurDesc => _get('Cover logos/watermarks', 'Logo/watermark များကို ဖုံးထုန်');
  String get subtitlesTitle => _get('Subtitles', 'စာတန်းထိုး');
  String get subtitlesDesc => _get('Add Myanmar subtitles', 'မြန်မာဘာသာ စာတန်း ထည့်မည်');
  String get colorAdjust => _get('Color Adjustment', 'အရောင် ပြင်ဆင်ခြင်း');
  String get colorAdjustDesc => _get('Adjust brightness, contrast', 'Brightness, Contrast ပြောင်းမည်');
  String get horizontalFlip => _get('Horizontal Flip', 'အလျားလိုက်လှန်ခြင်း');
  String get horizontalFlipDesc => _get('Flip video left-right', 'Video ကို ဘယ်ညာလှန်မည်');
  String get slightZoom => _get('Slight Zoom', 'အနည်းငယ် Zoom');
  String get slightZoomDesc => _get('Add 5% zoom', '5% Zoom ထည့်မည်');
  String get audioPitchShift => _get('Audio Pitch Shift', 'အသံ Pitch ပြောင်းခြင်း');
  String get audioPitchShiftDesc => _get('Change audio pitch (Copyright bypass)', 'Audio pitch ပြောင်း (Copyright bypass)');
  String get enableToggleHint => _get('Turn on toggle to enable', 'toggle ကို ဖွင့်ပါ');
  String get subtitlePosition => _get('Position', 'တည်နေရာ');
  String get positionTop => _get('Top', 'အပေါ်');
  String get positionCenter => _get('Center', 'အလယ်');
  String get positionBottom => _get('Bottom', 'အောက်');
  String get subtitleSize => _get('Size', 'အရွယ်အစား');
  String get bgStyle => _get('Background Style', 'နောက်ခံ Style');

  // ============================================
  // VIDEO CREATION - STEP 3
  // ============================================
  String get addLogo => _get('Add Logo', 'Logo ထည့်ခြင်း');
  String get addLogoDesc => _get('Put your logo on the video', 'သင့် Logo ကို Video ပေါ်တင်မည်');
  String get addOutro => _get('Add Outro', 'Outro ထည့်ခြင်း');
  String get addOutroDesc => _get('Add channel info at the end', 'Video အဆုံးမှာ channel info ထည့်မည်');
  String get enableLogoHint => _get('Turn on toggle to add logo', 'Logo ထည့်ရန် toggle ကို ဖွင့်ပါ');
  String get enableOutroHint => _get('Turn on toggle to add outro', 'Outro ထည့်ရန် toggle ကို ဖွင့်ပါ');
  String get videoSummary => _get('Video Summary', '📋 ဗီဒီယို အကျဉ်းချုပ်');
  String get duration => _get('Duration', 'ကြာချိန်');
  String get channelName => _get('Channel Name', 'Channel Name');
  String get channelNameHint => _get('Your Channel Name', 'သင့် Channel Name');
  String get outroDuration => _get('Duration', 'ကြာချိန်');
  String get seconds => _get('seconds', 'စက္ကန့်');
}
