import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/config/app_config.dart';
import '../../../../core/providers/theme_provider.dart';
import '../../../../core/providers/locale_provider.dart';
import '../../../../core/l10n/app_strings.dart';

/// Settings Screen - App preferences and configuration
class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  // Notification settings
  bool _pushNotifications = true;
  bool _emailNotifications = false;
  
  // Video settings
  bool _autoDownload = false;
  String _defaultQuality = '1080p';
  String _defaultVideoLanguage = 'Burmese';
  
  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final strings = ref.watch(stringsProvider);
    final themeMode = ref.watch(themeModeProvider);
    final locale = ref.watch(localeProvider);
    
    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        backgroundColor: colors.background,
        elevation: 0,
        title: Text(strings.settings, style: TextStyle(color: colors.textPrimary)),
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: colors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Theme Section
          _buildSectionHeader('🎨 ${strings.theme}', colors),
          const SizedBox(height: 12),
          _buildCard([
            _buildThemeTile(themeMode, colors, strings),
          ], colors),
          const SizedBox(height: 24),

          // Language Section
          _buildSectionHeader('🌐 ${strings.language}', colors),
          const SizedBox(height: 12),
          _buildCard([
            _buildLanguageTile(locale, colors, strings),
          ], colors),
          const SizedBox(height: 24),

          // Notifications Section
          _buildSectionHeader('🔔 ${strings.notifications}', colors),
          const SizedBox(height: 12),
          _buildCard([
            _buildSwitchTile(
              title: strings.pushNotifications,
              subtitle: strings.pushNotificationsDesc,
              value: _pushNotifications,
              onChanged: (v) => setState(() => _pushNotifications = v),
              colors: colors,
            ),
            _buildDivider(colors),
            _buildSwitchTile(
              title: strings.emailNotifications,
              subtitle: strings.emailNotificationsDesc,
              value: _emailNotifications,
              onChanged: (v) => setState(() => _emailNotifications = v),
              colors: colors,
            ),
          ], colors),
          const SizedBox(height: 24),

          // Video Settings Section
          _buildSectionHeader('🎬 ${strings.videoSettings}', colors),
          const SizedBox(height: 12),
          _buildCard([
            _buildListTile(
              title: strings.defaultVideoQuality,
              trailing: _defaultQuality,
              onTap: () => _showQualityPicker(colors, strings),
              colors: colors,
            ),
            _buildDivider(colors),
            _buildListTile(
              title: strings.defaultVideoLanguage,
              trailing: _defaultVideoLanguage,
              onTap: () => _showVideoLanguagePicker(colors, strings),
              colors: colors,
            ),
            _buildDivider(colors),
            _buildSwitchTile(
              title: strings.autoDownload,
              subtitle: strings.autoDownloadDesc,
              value: _autoDownload,
              onChanged: (v) => setState(() => _autoDownload = v),
              colors: colors,
            ),
          ], colors),
          const SizedBox(height: 24),

          // Storage Section
          _buildSectionHeader('💾 ${strings.storage}', colors),
          const SizedBox(height: 12),
          _buildCard([
            _buildListTile(
              title: strings.cacheSize,
              trailing: '24.5 MB',
              onTap: () {},
              colors: colors,
            ),
            _buildDivider(colors),
            _buildListTile(
              title: strings.clearCache,
              trailing: '',
              onTap: () => _clearCache(colors, strings),
              textColor: AppColors.error,
              colors: colors,
            ),
          ], colors),
          const SizedBox(height: 24),

          // About Section
          _buildSectionHeader('ℹ️ ${strings.about}', colors),
          const SizedBox(height: 12),
          _buildCard([
            _buildListTile(
              title: strings.version,
              trailing: AppConfig.appVersion,
              colors: colors,
            ),
            _buildDivider(colors),
            _buildListTile(
              title: strings.termsOfService,
              onTap: () => _openUrl(AppConfig.termsOfServiceUrl),
              colors: colors,
            ),
            _buildDivider(colors),
            _buildListTile(
              title: strings.privacyPolicy,
              onTap: () => _openUrl(AppConfig.privacyPolicyUrl),
              colors: colors,
            ),
          ], colors),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildThemeTile(ThemeMode themeMode, AppColorsExtension colors, AppStrings strings) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppColors.primary.withAlpha(30),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(themeMode.icon, color: AppColors.primary, size: 20),
      ),
      title: Text(strings.theme, style: TextStyle(color: colors.textPrimary, fontSize: 14)),
      subtitle: Text(
        themeMode == ThemeMode.dark ? strings.darkMode : 
        themeMode == ThemeMode.light ? strings.lightMode : strings.systemDefault,
        style: TextStyle(color: colors.textSecondary, fontSize: 12),
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildThemeButton(
            icon: Icons.light_mode,
            isSelected: themeMode == ThemeMode.light,
            onTap: () => ref.read(themeModeProvider.notifier).setThemeMode(ThemeMode.light),
            colors: colors,
          ),
          const SizedBox(width: 8),
          _buildThemeButton(
            icon: Icons.dark_mode,
            isSelected: themeMode == ThemeMode.dark,
            onTap: () => ref.read(themeModeProvider.notifier).setThemeMode(ThemeMode.dark),
            colors: colors,
          ),
          const SizedBox(width: 8),
          _buildThemeButton(
            icon: Icons.settings_brightness,
            isSelected: themeMode == ThemeMode.system,
            onTap: () => ref.read(themeModeProvider.notifier).setSystemTheme(),
            colors: colors,
          ),
        ],
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
    );
  }

  Widget _buildThemeButton({
    required IconData icon,
    required bool isSelected,
    required VoidCallback onTap,
    required AppColorsExtension colors,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : colors.surfaceVariant,
          borderRadius: BorderRadius.circular(8),
          border: isSelected ? null : Border.all(color: colors.border),
        ),
        child: Icon(
          icon,
          size: 18,
          color: isSelected ? Colors.white : colors.textSecondary,
        ),
      ),
    );
  }

  Widget _buildLanguageTile(Locale locale, AppColorsExtension colors, AppStrings strings) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppColors.secondary.withAlpha(30),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(locale.flag, style: const TextStyle(fontSize: 20)),
      ),
      title: Text(strings.appLanguage, style: TextStyle(color: colors.textPrimary, fontSize: 14)),
      subtitle: Text(
        locale.displayName,
        style: TextStyle(color: colors.textSecondary, fontSize: 12),
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildLanguageButton(
            label: '🇺🇸 EN',
            isSelected: locale.isEnglish,
            onTap: () => ref.read(localeProvider.notifier).setLocale(AppLocales.english),
            colors: colors,
          ),
          const SizedBox(width: 8),
          _buildLanguageButton(
            label: '🇲🇲 MM',
            isSelected: locale.isBurmese,
            onTap: () => ref.read(localeProvider.notifier).setLocale(AppLocales.burmese),
            colors: colors,
          ),
        ],
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
    );
  }

  Widget _buildLanguageButton({
    required String label,
    required bool isSelected,
    required VoidCallback onTap,
    required AppColorsExtension colors,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : colors.surfaceVariant,
          borderRadius: BorderRadius.circular(8),
          border: isSelected ? null : Border.all(color: colors.border),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: isSelected ? Colors.white : colors.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, AppColorsExtension colors) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: colors.textPrimary,
      ),
    );
  }

  Widget _buildCard(List<Widget> children, AppColorsExtension colors) {
    return Container(
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colors.border),
      ),
      child: Column(children: children),
    );
  }

  Widget _buildDivider(AppColorsExtension colors) {
    return Divider(height: 1, color: colors.divider, indent: 16, endIndent: 16);
  }

  Widget _buildSwitchTile({
    required String title,
    String? subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
    required AppColorsExtension colors,
  }) {
    return ListTile(
      title: Text(title, style: TextStyle(color: colors.textPrimary, fontSize: 14)),
      subtitle: subtitle != null
          ? Text(subtitle, style: TextStyle(color: colors.textSecondary, fontSize: 12))
          : null,
      trailing: Switch(
        value: value,
        onChanged: onChanged,
        activeColor: AppColors.primary,
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    );
  }

  Widget _buildListTile({
    required String title,
    String? subtitle,
    String? trailing,
    VoidCallback? onTap,
    Color? textColor,
    required AppColorsExtension colors,
  }) {
    return ListTile(
      title: Text(
        title,
        style: TextStyle(color: textColor ?? colors.textPrimary, fontSize: 14),
      ),
      subtitle: subtitle != null
          ? Text(
              subtitle,
              style: TextStyle(color: colors.textSecondary, fontSize: 12),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            )
          : null,
      trailing: trailing != null && trailing.isNotEmpty
          ? Text(trailing, style: TextStyle(color: colors.textSecondary, fontSize: 13))
          : onTap != null
              ? Icon(Icons.chevron_right, color: colors.textSecondary, size: 20)
              : null,
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    );
  }

  void _showQualityPicker(AppColorsExtension colors, AppStrings strings) {
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
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                strings.defaultVideoQuality,
                style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold),
              ),
            ),
            ...['720p', '1080p', '4K'].map((q) => ListTile(
              title: Text(q, style: TextStyle(color: colors.textPrimary)),
              trailing: _defaultQuality == q
                  ? const Icon(Icons.check, color: AppColors.primary)
                  : null,
              onTap: () {
                setState(() => _defaultQuality = q);
                Navigator.pop(ctx);
              },
            )),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  void _showVideoLanguagePicker(AppColorsExtension colors, AppStrings strings) {
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
            Padding(
              padding: const EdgeInsets.all(16),
              child: Text(
                strings.defaultVideoLanguage,
                style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold),
              ),
            ),
            ...['Burmese', 'English', 'Thai'].map((l) => ListTile(
              title: Text(l, style: TextStyle(color: colors.textPrimary)),
              trailing: _defaultVideoLanguage == l
                  ? const Icon(Icons.check, color: AppColors.primary)
                  : null,
              onTap: () {
                setState(() => _defaultVideoLanguage = l);
                Navigator.pop(ctx);
              },
            )),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  void _clearCache(AppColorsExtension colors, AppStrings strings) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: colors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('${strings.clearCache}?', style: TextStyle(color: colors.textPrimary)),
        content: Text(
          'This will clear all cached data including thumbnails and temporary files.',
          style: TextStyle(color: colors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(strings.cancel, style: TextStyle(color: colors.textSecondary)),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(strings.cacheCleared)),
              );
            },
            child: Text(strings.delete, style: const TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }

  Future<void> _openUrl(String url) async {
    try {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Cannot open: $url')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }
}
