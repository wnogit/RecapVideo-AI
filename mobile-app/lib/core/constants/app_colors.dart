import 'package:flutter/material.dart';

/// အရောင်များ - RecapVideo Brand Colors
class AppColors {
  // Brand အရောင်များ
  static const primary = Color(0xFF8B5CF6);      // Violet
  static const primaryDark = Color(0xFF7C3AED);
  static const secondary = Color(0xFFEC4899);    // Pink
  static const secondaryDark = Color(0xFFDB2777);
  
  // Background
  static const background = Color(0xFF0A0A0A);   // Almost black  
  static const surface = Color(0xFF1A1A1A);      // Dark gray
  static const surfaceVariant = Color(0xFF2A2A2A);
  
  // Text
  static const textPrimary = Color(0xFFFFFFFF);
  static const textSecondary = Color(0xFFB0B0B0);
  static const textTertiary = Color(0xFF808080);
  
  // Semantic Colors
  static const success = Color(0xFF10B981);
  static const warning = Color(0xFFF59E0B);
  static const error = Color(0xFFEF4444);
  static const info = Color(0xFF3B82F6);
  
  // Gradient
  static const gradientStart = primary;
  static const gradientEnd = secondary;
  
  static LinearGradient get primaryGradient => const LinearGradient(
    colors: [gradientStart, gradientEnd],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
