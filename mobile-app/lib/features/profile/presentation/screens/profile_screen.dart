import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/utils/burmese_numbers.dart';
import '../../../../core/providers/locale_provider.dart';
import '../../../../core/navigation/main_navigation.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import 'order_history_screen.dart';
import 'transaction_history_screen.dart';
import 'settings_screen.dart';
import 'help_screen.dart';

/// Profile Screen - Redesigned to match web design
class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  File? _avatarFile;

  String _formatNumber(int number, Locale locale) {
    if (locale.languageCode == 'my') {
      return number.toBurmese();
    }
    return number.toString();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final colors = context.colors;
    final strings = ref.watch(stringsProvider);
    final locale = ref.watch(localeProvider);
    
    final userName = user?.name ?? 'User';
    final userEmail = user?.email ?? 'email@example.com';
    final userCredits = user?.credits ?? 0;
    final firstLetter = userName.isNotEmpty ? userName[0].toUpperCase() : 'U';
    final isPro = userCredits > 0;
    final joinDate = _formatJoinDate(user?.createdAt, strings);

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        backgroundColor: colors.background,
        elevation: 0,
        title: Text(strings.profile, style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: Icon(Icons.settings, color: colors.textPrimary),
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const SettingsScreen()),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              const SizedBox(height: 16),

              // Profile Card - Web style
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: colors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: colors.border),
                ),
                child: Row(
                  children: [
                    // Avatar with camera icon
                    GestureDetector(
                      onTap: () => _pickAvatar(context, colors, strings),
                      child: Stack(
                        children: [
                          Container(
                            width: 70,
                            height: 70,
                            decoration: BoxDecoration(
                              gradient: _avatarFile == null
                                  ? const LinearGradient(
                                      colors: [Color(0xFF8B5CF6), Color(0xFF6B4CD4)],
                                    )
                                  : null,
                              shape: BoxShape.circle,
                              image: _avatarFile != null
                                  ? DecorationImage(
                                      image: FileImage(_avatarFile!),
                                      fit: BoxFit.cover,
                                    )
                                  : null,
                            ),
                            child: _avatarFile == null
                                ? Center(
                                    child: Text(
                                      firstLetter,
                                      style: const TextStyle(
                                        fontSize: 28,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                  )
                                : null,
                          ),
                          // Camera icon overlay
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Container(
                              width: 26,
                              height: 26,
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                shape: BoxShape.circle,
                                border: Border.all(color: colors.surface, width: 2),
                              ),
                              child: const Icon(Icons.camera_alt, size: 14, color: Colors.white),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    // User info
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Flexible(
                                child: Text(
                                  userName,
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: colors.textPrimary,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const SizedBox(width: 8),
                              if (isPro)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    gradient: const LinearGradient(
                                      colors: [Color(0xFF8B5CF6), Color(0xFFEC4899)],
                                    ),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text('Pro', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white)),
                                      SizedBox(width: 2),
                                      Text('⚡', style: TextStyle(fontSize: 10)),
                                    ],
                                  ),
                                )
                              else
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: colors.surfaceVariant,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: colors.border),
                                  ),
                                  child: Text(
                                    strings.free,
                                    style: TextStyle(fontSize: 11, color: colors.textSecondary, fontWeight: FontWeight.w500),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            userEmail,
                            style: TextStyle(
                              fontSize: 13,
                              color: colors.textSecondary,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Icon(Icons.credit_card, size: 14, color: colors.textSecondary),
                              const SizedBox(width: 4),
                              Text(
                                '${_formatNumber(userCredits, locale)} ${strings.credits.toLowerCase()}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: colors.textSecondary,
                                ),
                              ),
                              const SizedBox(width: 16),
                              Icon(Icons.calendar_today, size: 14, color: colors.textSecondary),
                              const SizedBox(width: 4),
                              Text(
                                joinDate,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: colors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Menu Section
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '📋 ${strings.menu}',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: colors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      decoration: BoxDecoration(
                        color: colors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: colors.border),
                      ),
                      child: Column(
                        children: [
                          _buildMenuItem(
                            context: context,
                            icon: Icons.video_library,
                            iconColor: Colors.purple,
                            label: strings.myVideos,
                            colors: colors,
                            onTap: () {
                              // Navigate to Videos tab
                              ref.read(navigationIndexProvider.notifier).state = 1;
                            },
                          ),
                          _buildDivider(colors),
                          _buildMenuItem(
                            context: context,
                            icon: Icons.history,
                            iconColor: Colors.green,
                            label: strings.orderHistory,
                            colors: colors,
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const OrderHistoryScreen()),
                            ),
                          ),
                          _buildDivider(colors),
                          _buildMenuItem(
                            context: context,
                            icon: Icons.swap_horiz,
                            iconColor: Colors.blue,
                            label: strings.transactionHistory,
                            colors: colors,
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const TransactionHistoryScreen()),
                            ),
                          ),
                          _buildDivider(colors),
                          _buildMenuItem(
                            context: context,
                            icon: Icons.help_outline,
                            iconColor: Colors.cyan,
                            label: strings.helpSupport,
                            colors: colors,
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const HelpScreen()),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Logout Button
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 48),
                child: OutlinedButton.icon(
                  onPressed: () => _showLogoutConfirmation(context, colors, strings),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 20),
                    side: const BorderSide(color: Colors.red, width: 1),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  icon: const Icon(Icons.logout, color: Colors.red, size: 16),
                  label: Text(
                    strings.logout,
                    style: const TextStyle(color: Colors.red, fontWeight: FontWeight.w500, fontSize: 13),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              
              // App Version
              Text(
                '${strings.version} 1.0.0',
                style: TextStyle(
                  fontSize: 12,
                  color: colors.textTertiary,
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  // ===== Helper Methods =====

  /// Format join date from DateTime
  String _formatJoinDate(DateTime? date, AppStrings strings) {
    if (date == null) return strings.unknown;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${months[date.month - 1]} ${date.year}';
  }

  /// Pick avatar image
  Future<void> _pickAvatar(BuildContext context, AppColorsExtension colors, AppStrings strings) async {
    final picker = ImagePicker();
    
    // Show bottom sheet for camera/gallery selection
    showModalBottomSheet(
      context: context,
      backgroundColor: colors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt, color: AppColors.primary),
              title: Text(strings.camera, style: TextStyle(color: colors.textPrimary)),
              onTap: () async {
                Navigator.pop(ctx);
                final image = await picker.pickImage(
                  source: ImageSource.camera,
                  maxWidth: 500,
                  maxHeight: 500,
                  imageQuality: 80,
                );
                if (image != null) {
                  setState(() => _avatarFile = File(image.path));
                  // TODO: Upload to server
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(strings.avatarUpdated)),
                    );
                  }
                }
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library, color: AppColors.primary),
              title: Text(strings.gallery, style: TextStyle(color: colors.textPrimary)),
              onTap: () async {
                Navigator.pop(ctx);
                final image = await picker.pickImage(
                  source: ImageSource.gallery,
                  maxWidth: 500,
                  maxHeight: 500,
                  imageQuality: 80,
                );
                if (image != null) {
                  setState(() => _avatarFile = File(image.path));
                  // TODO: Upload to server
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(strings.avatarUpdated)),
                    );
                  }
                }
              },
            ),
            if (_avatarFile != null)
              ListTile(
                leading: const Icon(Icons.delete, color: Colors.red),
                title: Text(strings.removePhoto, style: const TextStyle(color: Colors.red)),
                onTap: () {
                  Navigator.pop(ctx);
                  setState(() => _avatarFile = null);
                },
              ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  /// Show logout confirmation dialog
  void _showLogoutConfirmation(BuildContext context, AppColorsExtension colors, AppStrings strings) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: colors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(strings.logout, style: TextStyle(color: colors.textPrimary)),
        content: Text(
          strings.logoutConfirmation,
          style: TextStyle(color: colors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(strings.cancel, style: TextStyle(color: colors.textSecondary)),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) {
                context.go('/login');
              }
            },
            child: Text(strings.logout, style: const TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem({
    required BuildContext context,
    required IconData icon,
    required Color iconColor,
    required String label,
    required VoidCallback onTap,
    required AppColorsExtension colors,
  }) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: iconColor.withAlpha(30),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, size: 18, color: iconColor),
      ),
      title: Text(label, style: TextStyle(color: colors.textPrimary, fontSize: 14)),
      trailing: Icon(Icons.chevron_right, color: colors.textSecondary, size: 20),
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    );
  }

  Widget _buildDivider(AppColorsExtension colors) {
    return Divider(height: 1, color: colors.border, indent: 56, endIndent: 16);
  }
}
