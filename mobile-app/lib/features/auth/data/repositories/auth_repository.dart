import 'package:dio/dio.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/api/api_endpoints.dart';
import '../../../../core/models/auth_response.dart';
import '../../../../core/models/api_error.dart';
import '../../../../core/models/user.dart';

/// Auth Repository
class AuthRepository {
  final ApiClient _apiClient;

  AuthRepository(this._apiClient);

  /// Login with email and password
  Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.login,
        data: {
          'email': email,
          'password': password,
        },
      );

      // Debug: Print response for troubleshooting
      print('🔐 Login Response: ${response.data}');
      
      return AuthResponse.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      print('❌ DioException: ${e.message}');
      throw ApiError.fromDioError(e);
    } catch (e, stackTrace) {
      print('❌ Parsing Error: $e');
      print('📍 Stack: $stackTrace');
      throw ApiError(message: 'Login failed: ${e.toString()}', statusCode: 0);
    }
  }

  /// Sign up with name, email, and password
  Future<AuthResponse> signup({
    required String name,
    required String email,
    required String password,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.signup,
        data: {
          'name': name,
          'email': email,
          'password': password,
        },
      );

      return AuthResponse.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiError.fromDioError(e);
    }
  }

  /// Google Sign-In
  Future<AuthResponse> googleSignIn({
    required String idToken,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.googleSignIn,
        data: {
          'id_token': idToken,
        },
      );

      return AuthResponse.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw ApiError.fromDioError(e);
    }
  }

  /// Get current user - /auth/me returns only user object
  Future<User> getCurrentUser() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.me);
      print('👤 Get Current User Response: ${response.data}');
      
      // /auth/me returns {user: {...}} or just {...}
      final data = response.data as Map<String, dynamic>;
      if (data.containsKey('user')) {
        return User.fromJson(data['user'] as Map<String, dynamic>);
      }
      return User.fromJson(data);
    } on DioException catch (e) {
      print('❌ Get Current User Error: ${e.message}');
      throw ApiError.fromDioError(e);
    }
  }

  /// Logout
  Future<void> logout() async {
    _apiClient.clearAuthToken();
  }
}
