import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import '../config/app_config.dart';
import '../utils/token_storage_service.dart';
import 'ssl_pinning.dart';
import 'token_refresh_interceptor.dart';

/// API Client using Dio
/// 
/// Features:
/// - SSL Pinning (production only)
/// - Token Refresh Interceptor
/// - Request/Response Logging
/// - Error Handling
class ApiClient {
  late final Dio _dio;
  final TokenStorageService _tokenStorage;
  
  ApiClient({String? baseUrl, TokenStorageService? tokenStorage}) 
      : _tokenStorage = tokenStorage ?? TokenStorageService() {
    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl ?? AppConfig.apiBaseUrl,
        connectTimeout: AppConfig.connectTimeout,
        receiveTimeout: AppConfig.receiveTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );
    
    // Configure SSL Pinning (production only)
    if (AppConfig.enableSSLPinning) {
      SSLPinning.configureDio(_dio);
    }
    
    // Add interceptors in order
    _dio.interceptors.addAll([
      // Token refresh should be first to handle 401s
      TokenRefreshInterceptor(_dio, _tokenStorage),
      // Logging in debug mode only
      if (AppConfig.enableNetworkLogging) _loggingInterceptor(),
      _errorInterceptor(),
    ]);
    
    if (kDebugMode) {
      debugPrint('🌐 ApiClient initialized: ${baseUrl ?? AppConfig.apiBaseUrl}');
    }
  }
  
  /// Get Dio instance (for advanced usage)
  Dio get dio => _dio;
  
  /// Add auth token to requests
  void setAuthToken(String token) {
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }
  
  /// Remove auth token
  void clearAuthToken() {
    _dio.options.headers.remove('Authorization');
  }
  
  /// GET request
  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.get<T>(
      path,
      queryParameters: queryParameters,
      options: options,
    );
  }
  
  /// POST request
  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.post<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }
  
  /// PUT request
  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.put<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }
  
  /// DELETE request
  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.delete<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }
  
  /// PATCH request
  Future<Response<T>> patch<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.patch<T>(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }
  
  /// Logging interceptor
  Interceptor _loggingInterceptor() {
    return InterceptorsWrapper(
      onRequest: (options, handler) {
        debugPrint('🌐 ${options.method} ${options.path}');
        debugPrint('📤 Headers: ${options.headers}');
        if (options.data != null) {
          debugPrint('📤 Data: ${options.data}');
        }
        handler.next(options);
      },
      onResponse: (response, handler) {
        debugPrint('✅ ${response.statusCode} ${response.requestOptions.path}');
        debugPrint('📥 Response: ${response.data}');
        handler.next(response);
      },
      onError: (error, handler) {
        debugPrint('❌ ${error.response?.statusCode} ${error.requestOptions.path}');
        debugPrint('❌ Error: ${error.message}');
        if (error.response?.data != null) {
          debugPrint('❌ Data: ${error.response?.data}');
        }
        handler.next(error);
      },
    );
  }
  
  /// Error handling interceptor
  Interceptor _errorInterceptor() {
    return InterceptorsWrapper(
      onError: (error, handler) {
        // Handle different HTTP errors - log only, don't modify tokens
        // Token management is handled by AuthNotifier to prevent unintended logouts
        if (error.response != null) {
          switch (error.response!.statusCode) {
            case 401:
              // Unauthorized - let AuthNotifier handle token clearing
              // DO NOT clear token here - causes auto-logout issues
              debugPrint('⚠️ 401 Unauthorized - token may be expired');
              break;
            case 403:
              // Forbidden
              debugPrint('⚠️ 403 Forbidden');
              break;
            case 404:
              // Not found
              break;
            case 500:
            case 502:
            case 503:
              // Server errors
              debugPrint('⚠️ Server error: ${error.response!.statusCode}');
              break;
          }
        }
        handler.next(error);
      },
    );
  }
}
