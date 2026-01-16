/// API Endpoints
class ApiEndpoints {
  // Base URL (includes /api/v1)
  static const baseUrl = 'https://api.recapvideo.ai/api/v1';
  
  // Auth - paths relative to baseUrl
  static const login = '/auth/login';
  static const signup = '/auth/signup';
  static const googleSignIn = '/auth/google';
  static const refreshToken = '/auth/refresh';
  
  // User - /users/me endpoint (NOT /auth/me!)
  static const me = '/users/me';
  
  // Videos
  static const videos = '/videos';
  static String videoDetail(String id) => '/videos/$id';
  static String videoStatus(String id) => '/videos/$id/status';
  
  // Credits & Transactions
  static const packages = '/packages';
  static const transactions = '/credits/transactions';  // Fixed: was /users/me/transactions
  
  // Orders
  static const orders = '/orders';
  static String orderDetail(String id) => '/orders/$id';
  static String uploadPaymentScreenshot(String id) => '/orders/$id/upload';
}
