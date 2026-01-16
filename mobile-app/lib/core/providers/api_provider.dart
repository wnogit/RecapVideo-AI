import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';

/// Shared API Client Provider
/// Ensures the same Dio instance (and auth token) is used across the app
final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient();
});
