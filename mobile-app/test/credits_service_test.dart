import 'package:flutter_test/flutter_test.dart';
import 'package:recapvideo_mobile/core/api/credits_service.dart';

void main() {
  group('CreditPackage Model Tests', () {
    test('CreditPackage.fromJson creates valid package', () {
      final json = {
        'id': 'pkg_001',
        'name': 'Starter',
        'credits': 5,
        'price_mmk': 5000,
        'is_popular': false,
      };

      final package = CreditPackage.fromJson(json);

      expect(package.id, 'pkg_001');
      expect(package.name, 'Starter');
      expect(package.credits, 5);
      expect(package.priceMMK, 5000);
      expect(package.isPopular, false);
    });

    test('CreditPackage.fromJson handles price fallback', () {
      final json = {
        'id': 'pkg_002',
        'name': 'Basic',
        'credits': 10,
        'price': 9000,
      };

      final package = CreditPackage.fromJson(json);
      expect(package.priceMMK, 9000);
    });

    test('CreditPackage.fromJson handles missing fields', () {
      final json = {'id': 'pkg_003'};

      final package = CreditPackage.fromJson(json);

      expect(package.id, 'pkg_003');
      expect(package.name, '');
      expect(package.credits, 0);
      expect(package.priceMMK, 0);
    });
  });

  group('Order Model Tests', () {
    test('Order.fromJson creates valid order', () {
      final json = {
        'id': 'ord_001',
        'package_id': 'pkg_001',
        'status': 'approved',
        'amount': 5000,
        'credits': 5,
        'payment_method': 'kpay',
        'screenshot_url': 'https://cdn.recapvideo.ai/screenshots/001.jpg',
        'created_at': '2026-01-13T00:00:00Z',
      };

      final order = Order.fromJson(json);

      expect(order.id, 'ord_001');
      expect(order.packageId, 'pkg_001');
      expect(order.status, 'approved');
      expect(order.amount, 5000);
      expect(order.credits, 5);
      expect(order.paymentMethod, 'kpay');
      expect(order.screenshotUrl, isNotNull);
    });

    test('Order.fromJson handles missing optional fields', () {
      final json = {
        'id': 'ord_002',
        'package_id': 'pkg_002',
        'status': 'pending',
        'amount': 9000,
        'credits': 10,
      };

      final order = Order.fromJson(json);

      expect(order.id, 'ord_002');
      expect(order.paymentMethod, isNull);
      expect(order.screenshotUrl, isNull);
    });

    test('Order status values are correct', () {
      final pendingOrder = Order.fromJson({'id': '1', 'package_id': 'p1', 'status': 'pending', 'amount': 0, 'credits': 0});
      final approvedOrder = Order.fromJson({'id': '2', 'package_id': 'p2', 'status': 'approved', 'amount': 0, 'credits': 0});
      final rejectedOrder = Order.fromJson({'id': '3', 'package_id': 'p3', 'status': 'rejected', 'amount': 0, 'credits': 0});

      expect(pendingOrder.status, 'pending');
      expect(approvedOrder.status, 'approved');
      expect(rejectedOrder.status, 'rejected');
    });
  });
}
