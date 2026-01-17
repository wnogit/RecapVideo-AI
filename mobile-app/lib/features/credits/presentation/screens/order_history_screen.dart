import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';

/// Order model for display
class OrderItem {
  final String id;
  final int credits;
  final int amount;
  final String status;
  final String paymentMethod;
  final DateTime createdAt;

  const OrderItem({
    required this.id,
    required this.credits,
    required this.amount,
    required this.status,
    required this.paymentMethod,
    required this.createdAt,
  });
}

/// Mock orders provider
final ordersProvider = Provider<List<OrderItem>>((ref) => [
  OrderItem(
    id: 'ORD001',
    credits: 10,
    amount: 9000,
    status: 'approved',
    paymentMethod: 'KBZ Pay',
    createdAt: DateTime.now().subtract(const Duration(days: 2)),
  ),
  OrderItem(
    id: 'ORD002',
    credits: 25,
    amount: 20000,
    status: 'pending',
    paymentMethod: 'Wave Money',
    createdAt: DateTime.now().subtract(const Duration(hours: 5)),
  ),
  OrderItem(
    id: 'ORD003',
    credits: 5,
    amount: 5000,
    status: 'rejected',
    paymentMethod: 'CB Pay',
    createdAt: DateTime.now().subtract(const Duration(days: 7)),
  ),
]);

/// Order History Screen
class OrderHistoryScreen extends ConsumerWidget {
  const OrderHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orders = ref.watch(ordersProvider);
    final colors = context.colors;
    final strings = ref.watch(stringsProvider);

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        backgroundColor: colors.background,
        elevation: 0,
        title: Text(strings.orderHistory, style: TextStyle(color: colors.textPrimary)),
        iconTheme: IconThemeData(color: colors.textPrimary),
      ),
      body: orders.isEmpty
          ? _buildEmptyState(colors, strings)
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: orders.length,
              itemBuilder: (context, index) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _OrderCard(order: orders[index], colors: colors, strings: strings),
              ),
            ),
    );
  }

  Widget _buildEmptyState(AppColorsExtension colors, AppStrings strings) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.receipt_long, size: 64, color: colors.textTertiary),
          const SizedBox(height: 16),
          Text(
            strings.noData,
            style: TextStyle(color: colors.textSecondary, fontSize: 16),
          ),
        ],
      ),
    );
  }
}

/// Order Card
class _OrderCard extends StatelessWidget {
  final OrderItem order;
  final AppColorsExtension colors;
  final AppStrings strings;

  const _OrderCard({required this.order, required this.colors, required this.strings});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '#${order.id}',
                style: TextStyle(color: colors.textSecondary, fontSize: 12),
              ),
              _buildStatusBadge(order.status),
            ],
          ),
          const SizedBox(height: 12),

          // Credits and amount
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [colors.primary, colors.secondary],
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '${order.credits}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(strings.credits, style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.w500)),
                  Text(
                    '${_formatPrice(order.amount)} MMK',
                    style: TextStyle(color: colors.textSecondary, fontSize: 12),
                  ),
                ],
              ),
              const Spacer(),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(order.paymentMethod, style: TextStyle(color: colors.textSecondary, fontSize: 12)),
                  Text(_formatDate(order.createdAt), style: TextStyle(color: colors.textTertiary, fontSize: 11)),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    String label;

    switch (status) {
      case 'approved':
        color = Colors.green;
        label = strings.isEnglish ? 'Approved ✓' : 'အတည်ပြုပြီး ✓';
        break;
      case 'pending':
        color = Colors.orange;
        label = strings.isEnglish ? 'Pending' : 'စောင့်ဆိုင်းနေ';
        break;
      case 'rejected':
        color = Colors.red;
        label = strings.isEnglish ? 'Rejected' : 'ငြင်းဆိုပြီး';
        break;
      default:
        color = Colors.grey;
        label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withAlpha(30),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w500)),
    );
  }

  String _formatPrice(int price) {
    return price.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]},',
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inDays == 0) {
      return strings.isEnglish ? 'Today' : 'ဒီနေ့';
    } else if (diff.inDays == 1) {
      return strings.isEnglish ? 'Yesterday' : 'မနေ့က';
    } else if (diff.inDays < 7) {
      return strings.isEnglish ? '${diff.inDays} days ago' : 'လွန်ခဲ့သော ${diff.inDays} ရက်';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }
}
