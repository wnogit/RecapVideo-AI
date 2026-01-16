/// API Error Model
class ApiError {
  final String message;
  final int? statusCode;
  final String? detail;

  ApiError({
    required this.message,
    this.statusCode,
    this.detail,
  });

  factory ApiError.fromJson(Map<String, dynamic> json) {
    return ApiError(
      message: json['detail'] as String? ??
               json['message'] as String? ?? 
               json['error'] as String? ?? 
               'Unknown error occurred',
      statusCode: json['status_code'] as int?,
      detail: json['detail'] as String?,
    );
  }

  factory ApiError.fromDioError(dynamic error) {
    if (error.response != null && error.response.data != null) {
      try {
        return ApiError.fromJson(error.response.data as Map<String, dynamic>);
      } catch (_) {
        return ApiError(
          message: error.message ?? 'Network error occurred',
          statusCode: error.response?.statusCode,
        );
      }
    }
    return ApiError(
      message: error.message ?? 'Connection error occurred',
    );
  }

  @override
  String toString() => message;
}
