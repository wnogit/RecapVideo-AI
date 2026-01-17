import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../utils/token_storage_service.dart';
import 'api_endpoints.dart';

/// Token Refresh Interceptor
/// 
/// 401 error ရရင် refresh token သုံးပြီး access token အသစ်ယူပေးမယ်
/// Refresh မရရင် logout လုပ်မယ်
class TokenRefreshInterceptor extends Interceptor {
  final Dio _dio;
  final TokenStorageService _tokenStorage;
  
  // Prevent multiple simultaneous refresh requests
  bool _isRefreshing = false;
  
  // Queue requests while refreshing
  final List<({RequestOptions options, ErrorInterceptorHandler handler})> _pendingRequests = [];

  TokenRefreshInterceptor(this._dio, this._tokenStorage);

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    // Only handle 401 Unauthorized errors
    if (err.response?.statusCode != 401) {
      handler.next(err);
      return;
    }
    
    // Skip refresh for auth endpoints
    final path = err.requestOptions.path;
    if (path.contains('/auth/login') || 
        path.contains('/auth/signup') || 
        path.contains('/auth/refresh')) {
      handler.next(err);
      return;
    }
    
    debugPrint('🔄 Token expired - attempting refresh...');
    
    // If already refreshing, queue this request
    if (_isRefreshing) {
      debugPrint('⏳ Queuing request while refresh in progress: $path');
      _pendingRequests.add((options: err.requestOptions, handler: handler));
      return;
    }
    
    _isRefreshing = true;
    
    try {
      // Get refresh token
      final refreshToken = await _tokenStorage.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        debugPrint('❌ No refresh token available');
        _handleRefreshFailure(err, handler);
        return;
      }
      
      // Create new Dio instance for refresh (to avoid interceptor loop)
      final refreshDio = Dio(BaseOptions(
        baseUrl: ApiEndpoints.baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {'Content-Type': 'application/json'},
      ));
      
      // Call refresh endpoint
      final response = await refreshDio.post(
        ApiEndpoints.refreshToken,
        data: {'refresh_token': refreshToken},
      );
      
      if (response.statusCode == 200 && response.data != null) {
        final newAccessToken = response.data['access_token'] as String?;
        final newRefreshToken = response.data['refresh_token'] as String?;
        
        if (newAccessToken == null) {
          debugPrint('❌ No access token in refresh response');
          _handleRefreshFailure(err, handler);
          return;
        }
        
        // Save new tokens
        await _tokenStorage.saveAccessToken(newAccessToken);
        if (newRefreshToken != null) {
          await _tokenStorage.saveRefreshToken(newRefreshToken);
        }
        
        // Update Dio headers
        _dio.options.headers['Authorization'] = 'Bearer $newAccessToken';
        
        debugPrint('✅ Token refreshed successfully');
        
        // Retry original request
        final retryResponse = await _retryRequest(err.requestOptions, newAccessToken);
        handler.resolve(retryResponse);
        
        // Retry queued requests
        _retryPendingRequests(newAccessToken);
      } else {
        debugPrint('❌ Refresh response invalid');
        _handleRefreshFailure(err, handler);
      }
    } on DioException catch (e) {
      debugPrint('❌ Refresh request failed: ${e.message}');
      _handleRefreshFailure(err, handler);
    } catch (e) {
      debugPrint('❌ Unexpected error during refresh: $e');
      _handleRefreshFailure(err, handler);
    } finally {
      _isRefreshing = false;
    }
  }
  
  /// Retry the original request with new token
  Future<Response> _retryRequest(RequestOptions options, String newToken) async {
    final newOptions = Options(
      method: options.method,
      headers: {
        ...options.headers,
        'Authorization': 'Bearer $newToken',
      },
    );
    
    return await _dio.request(
      options.path,
      options: newOptions,
      data: options.data,
      queryParameters: options.queryParameters,
    );
  }
  
  /// Retry all pending requests with new token
  void _retryPendingRequests(String newToken) async {
    final requests = List.of(_pendingRequests);
    _pendingRequests.clear();
    
    for (final request in requests) {
      try {
        final response = await _retryRequest(request.options, newToken);
        request.handler.resolve(response);
      } catch (e) {
        request.handler.reject(
          DioException(requestOptions: request.options, error: e),
        );
      }
    }
  }
  
  /// Handle refresh failure - clear tokens and reject all pending
  void _handleRefreshFailure(DioException originalError, ErrorInterceptorHandler handler) {
    _isRefreshing = false;
    
    // Clear tokens (will trigger logout in AuthNotifier)
    _tokenStorage.clearAll();
    
    // Reject all pending requests
    for (final request in _pendingRequests) {
      request.handler.reject(originalError);
    }
    _pendingRequests.clear();
    
    // Reject original request
    handler.next(originalError);
  }
}
