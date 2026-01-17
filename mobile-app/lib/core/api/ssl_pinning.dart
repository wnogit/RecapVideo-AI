import 'dart:io';
import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:dio/io.dart';
import 'package:flutter/foundation.dart';

/// SSL Certificate Pinning Configuration
/// 
/// Production မထုတ်ခင် certificate fingerprint ထည့်ရန်
/// Command to get fingerprint:
/// openssl s_client -connect api.recapvideo.ai:443 | openssl x509 -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64
class SSLPinning {
  /// SHA-256 fingerprints of valid certificates
  /// TODO: Production certificate fingerprint ထည့်ပါ
  static const List<String> validFingerprints = [
    // Primary certificate
    'YOUR_CERTIFICATE_SHA256_FINGERPRINT_HERE',
    // Backup certificate (optional)
  ];
  
  /// Allowed hosts for SSL pinning
  static const List<String> pinnedHosts = [
    'api.recapvideo.ai',
  ];

  /// Configure SSL pinning for Dio client
  /// Only enabled in release mode
  static void configureDio(dynamic dio) {
    // Skip in debug mode for easier development
    if (kDebugMode) {
      debugPrint('⚠️ SSL Pinning skipped in debug mode');
      return;
    }
    
    // Check if fingerprints are configured
    if (validFingerprints.isEmpty || 
        validFingerprints.first == 'YOUR_CERTIFICATE_SHA256_FINGERPRINT_HERE') {
      debugPrint('⚠️ SSL Pinning not configured - add certificate fingerprints');
      return;
    }

    // Configure custom certificate validation
    (dio.httpClientAdapter as IOHttpClientAdapter).createHttpClient = () {
      final client = HttpClient()
        ..badCertificateCallback = (X509Certificate cert, String host, int port) {
          // Only apply pinning to our API domain
          if (!pinnedHosts.contains(host)) {
            return true; // Allow other domains
          }
          
          // Get certificate fingerprint
          final fingerprint = _getCertificateFingerprint(cert);
          
          // Check if fingerprint matches any valid certificate
          final isValid = validFingerprints.any(
            (valid) => valid.toUpperCase() == fingerprint.toUpperCase()
          );
          
          if (!isValid) {
            debugPrint('❌ SSL Pinning failed for $host');
            debugPrint('   Expected: ${validFingerprints.first}');
            debugPrint('   Got: $fingerprint');
          }
          
          return isValid;
        };
      return client;
    };
    
    debugPrint('✅ SSL Pinning configured for: ${pinnedHosts.join(', ')}');
  }
  
  /// Get SHA-256 fingerprint of certificate
  static String _getCertificateFingerprint(X509Certificate cert) {
    // Convert certificate DER bytes to SHA-256 hash
    final derBytes = cert.der;
    final digest = sha256.convert(derBytes);
    return digest.bytes
        .map((b) => b.toRadixString(16).padLeft(2, '0'))
        .join(':')
        .toUpperCase();
  }
}
