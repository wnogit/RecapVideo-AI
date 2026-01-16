import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_client.dart';
import 'api_endpoints.dart';
import '../providers/api_provider.dart';  // Use shared authenticated client

/// Credit Package model
class CreditPackage {
  final String id;
  final String name;
  final int credits;
  final int priceMMK;
  final bool isPopular;

  CreditPackage({
    required this.id,
    required this.name,
    required this.credits,
    required this.priceMMK,
    this.isPopular = false,
  });

  factory CreditPackage.fromJson(Map<String, dynamic> json) {
    return CreditPackage(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      credits: json['credits'] ?? 0,
      priceMMK: json['price_mmk'] ?? json['price'] ?? 0,
      isPopular: json['is_popular'] ?? false,
    );
  }
}

/// Order model
class Order {
  final String id;
  final String packageId;
  final String status; // pending, approved, rejected
  final int amount;
  final int credits;
  final String? paymentMethod;
  final String? screenshotUrl;
  final DateTime createdAt;

  Order({
    required this.id,
    required this.packageId,
    required this.status,
    required this.amount,
    required this.credits,
    this.paymentMethod,
    this.screenshotUrl,
    required this.createdAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'] ?? '',
      packageId: json['package_id'] ?? '',
      status: json['status'] ?? 'pending',
      amount: json['amount'] ?? 0,
      credits: json['credits'] ?? 0,
      paymentMethod: json['payment_method'],
      screenshotUrl: json['screenshot_url'],
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
    );
  }
}

/// Credits API Service
class CreditsService {
  final ApiClient _client;

  CreditsService(this._client);

  /// Get available packages
  Future<List<CreditPackage>> getPackages() async {
    try {
      final response = await _client.get(ApiEndpoints.packages);
      final List<dynamic> data = response.data['data'] ?? response.data ?? [];
      return data.map((json) => CreditPackage.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to fetch packages: $e');
    }
  }

  /// Create order
  Future<Order> createOrder({
    required String packageId,
    required String paymentMethod,
  }) async {
    try {
      final response = await _client.post(
        ApiEndpoints.orders,
        data: {
          'package_id': packageId,
          'payment_method': paymentMethod,
        },
      );
      return Order.fromJson(response.data['data'] ?? response.data);
    } catch (e) {
      throw Exception('Failed to create order: $e');
    }
  }

  /// Upload payment screenshot
  Future<Order> uploadScreenshot(String orderId, File imageFile) async {
    try {
      final fileName = imageFile.path.split('/').last;
      final formData = FormData.fromMap({
        'screenshot': await MultipartFile.fromFile(
          imageFile.path,
          filename: fileName,
        ),
      });
      
      final response = await _client.post(
        ApiEndpoints.uploadPaymentScreenshot(orderId),
        data: formData,
      );
      return Order.fromJson(response.data['data'] ?? response.data);
    } catch (e) {
      throw Exception('Failed to upload screenshot: $e');
    }
  }

  /// Get order by ID
  Future<Order> getOrder(String id) async {
    try {
      final response = await _client.get(ApiEndpoints.orderDetail(id));
      return Order.fromJson(response.data['data'] ?? response.data);
    } catch (e) {
      throw Exception('Failed to fetch order: $e');
    }
  }

  /// Get all orders
  Future<List<Order>> getOrders() async {
    try {
      final response = await _client.get(ApiEndpoints.orders);
      final List<dynamic> data = response.data['data'] ?? response.data ?? [];
      return data.map((json) => Order.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to fetch orders: $e');
    }
  }
  
  /// Get transaction history
  Future<List<Transaction>> getTransactions() async {
    try {
      final response = await _client.get(ApiEndpoints.transactions);
      final List<dynamic> data = response.data['data'] ?? response.data ?? [];
      return data.map((json) => Transaction.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to fetch transactions: $e');
    }
  }
}

/// Transaction model for credit history
class Transaction {
  final String id;
  final String transactionType; // purchase, usage, bonus, refund
  final int amount;
  final int balanceAfter;
  final String? description;
  final DateTime createdAt;

  Transaction({
    required this.id,
    required this.transactionType,
    required this.amount,
    required this.balanceAfter,
    this.description,
    required this.createdAt,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'] ?? '',
      transactionType: json['transaction_type'] ?? 'usage',
      amount: json['amount'] ?? 0,
      balanceAfter: json['balance_after'] ?? 0,
      description: json['description'],
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
    );
  }
  
  String get typeLabel {
    switch (transactionType) {
      case 'purchase': return 'Credit Purchase';
      case 'usage': return 'Video Creation';
      case 'bonus': return 'Bonus Credits';
      case 'refund': return 'Refund';
      default: return transactionType;
    }
  }
  
  bool get isPositive => amount > 0;
}

/// Provider for credits service - uses shared authenticated apiClientProvider
final creditsServiceProvider = Provider<CreditsService>((ref) {
  final client = ref.watch(apiClientProvider);
  return CreditsService(client);
});
