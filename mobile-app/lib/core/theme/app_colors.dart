import 'package:flutter/material.dart';

/// အရောင်များ - RecapVideo Brand Colors
/// Supports Light & Dark Theme
class AppColors {
  // ============================================
  // BRAND COLORS (Same for both themes)
  // ============================================
  static const primary = Color(0xFF8B5CF6);      // Violet
  static const primaryDark = Color(0xFF7C3AED);
  static const primaryLight = Color(0xFFA78BFA);
  static const secondary = Color(0xFFEC4899);    // Pink
  static const secondaryDark = Color(0xFFDB2777);
  static const secondaryLight = Color(0xFFF472B6);
  
  // Semantic Colors (Same for both themes)
  static const success = Color(0xFF10B981);
  static const successLight = Color(0xFF34D399);
  static const warning = Color(0xFFF59E0B);
  static const warningLight = Color(0xFFFBBF24);
  static const error = Color(0xFFEF4444);
  static const errorLight = Color(0xFFF87171);
  static const info = Color(0xFF3B82F6);
  static const infoLight = Color(0xFF60A5FA);
  
  // ============================================
  // DARK THEME COLORS
  // ============================================
  static const darkBackground = Color(0xFF0A0A0A);     // Almost black
  static const darkSurface = Color(0xFF1A1A1A);        // Dark gray
  static const darkSurfaceVariant = Color(0xFF2A2A2A);
  static const darkSurfaceElevated = Color(0xFF333333);
  static const darkTextPrimary = Color(0xFFFFFFFF);
  static const darkTextSecondary = Color(0xFFB0B0B0);
  static const darkTextTertiary = Color(0xFF808080);
  static const darkDivider = Color(0xFF333333);
  static const darkBorder = Color(0xFF404040);
  
  // ============================================
  // LIGHT THEME COLORS
  // ============================================
  static const lightBackground = Color(0xFFF8FAFC);     // Light gray
  static const lightSurface = Color(0xFFFFFFFF);        // White
  static const lightSurfaceVariant = Color(0xFFF1F5F9);
  static const lightSurfaceElevated = Color(0xFFE2E8F0);
  static const lightTextPrimary = Color(0xFF1E293B);
  static const lightTextSecondary = Color(0xFF64748B);
  static const lightTextTertiary = Color(0xFF94A3B8);
  static const lightDivider = Color(0xFFE2E8F0);
  static const lightBorder = Color(0xFFCBD5E1);
  
  // ============================================
  // GRADIENT
  // ============================================
  static const gradientStart = primary;
  static const gradientEnd = secondary;
  
  static LinearGradient get primaryGradient => const LinearGradient(
    colors: [gradientStart, gradientEnd],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static LinearGradient get primaryGradientVertical => const LinearGradient(
    colors: [gradientStart, gradientEnd],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
  
  // ============================================
  // LEGACY SUPPORT (For backward compatibility)
  // Use context.colors instead for theme-aware colors
  // ============================================
  @Deprecated('Use Theme.of(context).extension<AppColorsExtension>() instead')
  static const background = darkBackground;
  @Deprecated('Use Theme.of(context).extension<AppColorsExtension>() instead')
  static const surface = darkSurface;
  @Deprecated('Use Theme.of(context).extension<AppColorsExtension>() instead')
  static const surfaceVariant = darkSurfaceVariant;
  @Deprecated('Use Theme.of(context).extension<AppColorsExtension>() instead')
  static const textPrimary = darkTextPrimary;
  @Deprecated('Use Theme.of(context).extension<AppColorsExtension>() instead')
  static const textSecondary = darkTextSecondary;
  @Deprecated('Use Theme.of(context).extension<AppColorsExtension>() instead')
  static const textTertiary = darkTextTertiary;
}

/// Theme Extension for runtime color access
class AppColorsExtension extends ThemeExtension<AppColorsExtension> {
  final Color background;
  final Color surface;
  final Color surfaceVariant;
  final Color surfaceElevated;
  final Color textPrimary;
  final Color textSecondary;
  final Color textTertiary;
  final Color divider;
  final Color border;
  final bool isDark;

  const AppColorsExtension({
    required this.background,
    required this.surface,
    required this.surfaceVariant,
    required this.surfaceElevated,
    required this.textPrimary,
    required this.textSecondary,
    required this.textTertiary,
    required this.divider,
    required this.border,
    required this.isDark,
  });

  // Brand Colors (same for both themes)
  Color get primary => AppColors.primary;
  Color get primaryDark => AppColors.primaryDark;
  Color get primaryLight => AppColors.primaryLight;
  Color get secondary => AppColors.secondary;
  Color get secondaryDark => AppColors.secondaryDark;
  Color get secondaryLight => AppColors.secondaryLight;
  
  // Semantic Colors (same for both themes)
  Color get success => AppColors.success;
  Color get successLight => AppColors.successLight;
  Color get warning => AppColors.warning;
  Color get warningLight => AppColors.warningLight;
  Color get error => AppColors.error;
  Color get errorLight => AppColors.errorLight;
  Color get info => AppColors.info;
  Color get infoLight => AppColors.infoLight;

  // Dark Theme Colors
  static const dark = AppColorsExtension(
    background: AppColors.darkBackground,
    surface: AppColors.darkSurface,
    surfaceVariant: AppColors.darkSurfaceVariant,
    surfaceElevated: AppColors.darkSurfaceElevated,
    textPrimary: AppColors.darkTextPrimary,
    textSecondary: AppColors.darkTextSecondary,
    textTertiary: AppColors.darkTextTertiary,
    divider: AppColors.darkDivider,
    border: AppColors.darkBorder,
    isDark: true,
  );

  // Light Theme Colors
  static const light = AppColorsExtension(
    background: AppColors.lightBackground,
    surface: AppColors.lightSurface,
    surfaceVariant: AppColors.lightSurfaceVariant,
    surfaceElevated: AppColors.lightSurfaceElevated,
    textPrimary: AppColors.lightTextPrimary,
    textSecondary: AppColors.lightTextSecondary,
    textTertiary: AppColors.lightTextTertiary,
    divider: AppColors.lightDivider,
    border: AppColors.lightBorder,
    isDark: false,
  );

  @override
  AppColorsExtension copyWith({
    Color? background,
    Color? surface,
    Color? surfaceVariant,
    Color? surfaceElevated,
    Color? textPrimary,
    Color? textSecondary,
    Color? textTertiary,
    Color? divider,
    Color? border,
    bool? isDark,
  }) {
    return AppColorsExtension(
      background: background ?? this.background,
      surface: surface ?? this.surface,
      surfaceVariant: surfaceVariant ?? this.surfaceVariant,
      surfaceElevated: surfaceElevated ?? this.surfaceElevated,
      textPrimary: textPrimary ?? this.textPrimary,
      textSecondary: textSecondary ?? this.textSecondary,
      textTertiary: textTertiary ?? this.textTertiary,
      divider: divider ?? this.divider,
      border: border ?? this.border,
      isDark: isDark ?? this.isDark,
    );
  }

  @override
  AppColorsExtension lerp(ThemeExtension<AppColorsExtension>? other, double t) {
    if (other is! AppColorsExtension) return this;
    return AppColorsExtension(
      background: Color.lerp(background, other.background, t)!,
      surface: Color.lerp(surface, other.surface, t)!,
      surfaceVariant: Color.lerp(surfaceVariant, other.surfaceVariant, t)!,
      surfaceElevated: Color.lerp(surfaceElevated, other.surfaceElevated, t)!,
      textPrimary: Color.lerp(textPrimary, other.textPrimary, t)!,
      textSecondary: Color.lerp(textSecondary, other.textSecondary, t)!,
      textTertiary: Color.lerp(textTertiary, other.textTertiary, t)!,
      divider: Color.lerp(divider, other.divider, t)!,
      border: Color.lerp(border, other.border, t)!,
      isDark: t < 0.5 ? isDark : other.isDark,
    );
  }
}

/// BuildContext Extension for easy access to theme colors
extension AppColorsContext on BuildContext {
  /// Get AppColorsExtension from current theme
  AppColorsExtension get colors {
    return Theme.of(this).extension<AppColorsExtension>() ?? AppColorsExtension.dark;
  }
  
  /// Check if current theme is dark
  bool get isDarkMode => colors.isDark;
}
