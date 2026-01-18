# RecapVideo Mobile App - ProGuard Rules
# Code Obfuscation & Optimization Configuration

# Keep Flutter & Dart classes
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# Keep our app's main classes
-keep class ai.recapvideo.** { *; }

# Keep Dio HTTP client
-keep class com.squareup.okhttp3.** { *; }
-keep interface com.squareup.okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# Keep Flutter Secure Storage
-keep class com.it_nomads.fluttersecurestorage.** { *; }

# Keep Jailbreak Detection
-keep class com.scottyab.** { *; }

# Keep JSON Serialization
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes SourceFile,LineNumberTable

# Keep Firebase (if using)
-keep class com.google.firebase.** { *; }

# Keep Google Play Core (for deferred components)
-dontwarn com.google.android.play.core.**
-keep class com.google.android.play.core.** { *; }
-keep interface com.google.android.play.core.** { *; }

# Security - Hide sensitive class names (optional)
# -repackageclasses 'ai.recapvideo.internal'

# Optimization settings
-optimizationpasses 5
-dontusemixedcaseclassnames
-verbose

# Debug info removal for release
-renamesourcefileattribute SourceFile
