import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/config/app_config.dart';

/// Help & Support Screen
class HelpScreen extends ConsumerWidget {
  const HelpScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = context.colors;
    final strings = ref.watch(stringsProvider);
    
    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        backgroundColor: colors.background,
        elevation: 0,
        title: Text(strings.helpSupport, style: TextStyle(color: colors.textPrimary)),
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: colors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Quick Help Banner
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [colors.primary, colors.secondary],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withAlpha(50),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.support_agent, color: Colors.white, size: 28),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        strings.needHelp,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        strings.helpDescription,
                        style: TextStyle(
                          color: Colors.white.withAlpha(200),
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // FAQs Section
          _buildSectionHeader(colors, '📚 ${strings.faqs}'),
          const SizedBox(height: 12),
          _buildFAQCard(
            context,
            colors: colors,
            question: strings.faq1Question,
            answer: strings.faq1Answer,
          ),
          const SizedBox(height: 8),
          _buildFAQCard(
            context,
            colors: colors,
            question: strings.faq2Question,
            answer: strings.faq2Answer,
          ),
          const SizedBox(height: 8),
          _buildFAQCard(
            context,
            colors: colors,
            question: strings.faq3Question,
            answer: strings.faq3Answer,
          ),
          const SizedBox(height: 8),
          _buildFAQCard(
            context,
            colors: colors,
            question: strings.faq4Question,
            answer: strings.faq4Answer,
          ),
          const SizedBox(height: 8),
          _buildFAQCard(
            context,
            colors: colors,
            question: strings.faq5Question,
            answer: strings.faq5Answer,
          ),
          const SizedBox(height: 24),

          // Contact Section
          _buildSectionHeader(colors, '📞 ${strings.contactUs}'),
          const SizedBox(height: 12),
          _buildContactCard(
            context,
            colors: colors,
            icon: Icons.email_outlined,
            title: strings.email,
            value: AppConfig.supportEmail,
            onTap: () => _copyToClipboard(context, AppConfig.supportEmail),
          ),
          const SizedBox(height: 8),
          _buildContactCard(
            context,
            colors: colors,
            icon: Icons.telegram,
            title: strings.telegram,
            value: AppConfig.supportTelegram,
            onTap: () => _openTelegram(context),
          ),
          const SizedBox(height: 8),
          _buildContactCard(
            context,
            colors: colors,
            icon: Icons.language,
            title: strings.website,
            value: AppConfig.websiteUrl,
            onTap: () => _openUrl(context, AppConfig.websiteUrl),
          ),
          const SizedBox(height: 24),

          // Additional Help
          _buildSectionHeader(colors, '💡 ${strings.quickTips}'),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: colors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildTip(colors, '✅', 'YouTube Shorts (vertical videos) အတွက်သာ သုံးနိုင်ပါတယ်'),
                const SizedBox(height: 12),
                _buildTip(colors, '✅', 'Copyright protection ဖွင့်ထားရင် video ပိုလုံခြုံပါတယ်'),
                const SizedBox(height: 12),
                _buildTip(colors, '✅', 'Logo ထည့်ရင် channel branding ကောင်းပါတယ်'),
                const SizedBox(height: 12),
                _buildTip(colors, '✅', 'Subtitle ထည့်ရင် engagement ပိုရပါတယ်'),
              ],
            ),
          ),
          const SizedBox(height: 32),

          // Report Issue Button
          OutlinedButton.icon(
            onPressed: () => _showReportDialog(context, colors, strings),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              side: BorderSide(color: colors.border),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            icon: Icon(Icons.bug_report_outlined, color: colors.warning),
            label: Text(
              strings.reportIssue,
              style: TextStyle(color: colors.warning),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(AppColorsExtension colors, String title) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: colors.textPrimary,
      ),
    );
  }

  Widget _buildFAQCard(BuildContext context, {required AppColorsExtension colors, required String question, required String answer}) {
    return Container(
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colors.border),
      ),
      child: ExpansionTile(
        tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        childrenPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        iconColor: colors.primary,
        collapsedIconColor: colors.textSecondary,
        title: Text(
          question,
          style: TextStyle(
            color: colors.textPrimary,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        children: [
          Text(
            answer,
            style: TextStyle(
              color: colors.textSecondary,
              fontSize: 13,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContactCard(
    BuildContext context, {
    required AppColorsExtension colors,
    required IconData icon,
    required String title,
    required String value,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: colors.border),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: colors.primary.withAlpha(30),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: colors.primary, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      color: colors.textSecondary,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    value,
                    style: TextStyle(
                      color: colors.textPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios, color: colors.textSecondary, size: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildTip(AppColorsExtension colors, String emoji, String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(emoji, style: const TextStyle(fontSize: 14)),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              color: colors.textSecondary,
              fontSize: 13,
              height: 1.4,
            ),
          ),
        ),
      ],
    );
  }

  void _copyToClipboard(BuildContext context, String text) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Copied: $text')),
    );
  }

  Future<void> _openTelegram(BuildContext context) async {
    final telegramUrl = AppConfig.supportTelegram;
    Uri uri;
    
    // Try to open Telegram app first, then fallback to browser
    if (telegramUrl.startsWith('@')) {
      // It's a username like @recapvideo
      final username = telegramUrl.substring(1);
      uri = Uri.parse('https://t.me/$username');
    } else if (telegramUrl.startsWith('https://')) {
      uri = Uri.parse(telegramUrl);
    } else {
      uri = Uri.parse('https://t.me/$telegramUrl');
    }
    
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Could not open Telegram')),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  Future<void> _openUrl(BuildContext context, String url) async {
    Uri uri;
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      uri = Uri.parse(url);
    } else {
      uri = Uri.parse('https://$url');
    }
    
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Could not open: $url')),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  void _showReportDialog(BuildContext context, AppColorsExtension colors, AppStrings strings) {
    final controller = TextEditingController();
    
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: colors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(strings.reportIssue, style: TextStyle(color: colors.textPrimary)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              strings.isEnglish ? 'Describe the issue you\'re experiencing:' : 'ကြုံတွေ့နေတဲ့ ပြဿနာကို ရှင်းပြပါ:',
              style: TextStyle(color: colors.textSecondary, fontSize: 13),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              maxLines: 4,
              style: TextStyle(color: colors.textPrimary),
              decoration: InputDecoration(
                hintText: strings.isEnglish ? 'Enter details...' : 'အသေးစိတ် ထည့်ပါ...',
                hintStyle: TextStyle(color: colors.textTertiary),
                filled: true,
                fillColor: colors.background,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ],
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
                SnackBar(content: Text(strings.isEnglish ? 'Report submitted. Thank you!' : 'တင်ပြပြီးပါပြီ။ ကျေးဇူးပါတယ်!')),
              );
            },
            child: Text(strings.submit, style: TextStyle(color: colors.primary)),
          ),
        ],
      ),
    );
  }
}
