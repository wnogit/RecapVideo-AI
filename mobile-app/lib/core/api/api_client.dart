import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';

/// SSL Pinning ဖွင့်/ပိတ် control
/// TODO: Production မထုတ်ခင် SSL Pinning ထည့်ရန်။ 
/// NOTE: Temporarily disabled - will add with proper conditional imports

/// API Client using Dio
class ApiClient {
  late final Dio _dio;
  
  ApiClient({String? baseUrl}) {
    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl ?? 'https://api.recapvideo.ai/api/v1',
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );
    
    // Add interceptors
    _dio.interceptors.addAll([
      _loggingInterceptor(),
      _errorInterceptor(),
    ]);
  }
  
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
