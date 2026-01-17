import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../providers/video_creation_provider.dart';

/// Step 3 - Branding: Logo and Outro with Web-style collapsible sections
class Step3BrandingWidget extends ConsumerStatefulWidget {
  const Step3BrandingWidget({super.key});

  @override
  ConsumerState<Step3BrandingWidget> createState() => _Step3BrandingWidgetState();
}

class _Step3BrandingWidgetState extends ConsumerState<Step3BrandingWidget> {
  bool _logoExpanded = false;
  bool _outroExpanded = false;

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(videoCreationProvider);
    final options = state.options;
    final colors = context.colors;
    final strings = ref.watch(stringsProvider);

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Title
          Row(
            children: [
              const Text('✨', style: TextStyle(fontSize: 20)),
              const SizedBox(width: 8),
              Text(
                strings.branding,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: colors.textPrimary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            strings.brandingSubtitle,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: colors.textSecondary,
            ),
          ),
          const SizedBox(height: 20),

          // 1. Logo - Collapsible with Toggle
          _buildCollapsibleSection(
            colors: colors,
            icon: Icons.image_outlined,
            iconColor: Colors.pink,
            title: 'Logo ထည့်ခြင်း',
            subtitle: 'သင့် Logo ကို Video ပေါ်တင်မည်',
            isExpanded: _logoExpanded,
            hasSwitch: true,
            switchValue: options.logoOptions.enabled,
            onSwitchChanged: (value) {
              ref.read(videoCreationProvider.notifier).toggleLogo();
              if (value) setState(() => _logoExpanded = true);
            },
            onToggle: () => setState(() => _logoExpanded = !_logoExpanded),
            child: _buildLogoContent(options, colors),
          ),
          const SizedBox(height: 12),

          // 2. Outro - Collapsible with Toggle
          _buildCollapsibleSection(
            colors: colors,
            icon: Icons.movie_outlined,
            iconColor: Colors.orange,
            title: 'Outro ထည့်ခြင်း',
            subtitle: 'Video အဆုံးမှာ channel info ထည့်မည်',
            isExpanded: _outroExpanded,
            hasSwitch: true,
            switchValue: options.outroOptions.enabled,
            onSwitchChanged: (value) {
              ref.read(videoCreationProvider.notifier).toggleOutro();
              if (value) setState(() => _outroExpanded = true);
            },
            onToggle: () => setState(() => _outroExpanded = !_outroExpanded),
            child: _buildOutroContent(options, colors),
          ),
          const SizedBox(height: 24),

          // Summary Card
          _buildSummaryCard(options, colors),
          const SizedBox(height: 16),

          // Credit Cost Card
          _buildCreditCard(colors, strings),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildCollapsibleSection({
    required AppColorsExtension colors,
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required bool isExpanded,
    required VoidCallback onToggle,
    required Widget child,
    bool hasSwitch = false,
    bool switchValue = false,
    ValueChanged<bool>? onSwitchChanged,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
      ),
      child: Column(
        children: [
          InkWell(
            onTap: onToggle,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: iconColor.withAlpha(30),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(icon, size: 22, color: iconColor),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: TextStyle(
                            color: colors.textPrimary,
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          subtitle,
                          style: TextStyle(
                            color: colors.textTertiary,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (hasSwitch)
                    Switch(
                      value: switchValue,
                      onChanged: onSwitchChanged,
                      activeColor: colors.primary,
                    )
                  else
                    AnimatedRotation(
                      turns: isExpanded ? 0.5 : 0,
                      duration: const Duration(milliseconds: 200),
                      child: Icon(
                        Icons.keyboard_arrow_down,
                        color: colors.textTertiary,
                        size: 24,
                      ),
                    ),
                ],
              ),
            ),
          ),
          AnimatedCrossFade(
            firstChild: const SizedBox(width: double.infinity),
            secondChild: Column(
              children: [
                Divider(height: 1, color: colors.border),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: child,
                ),
              ],
            ),
            crossFadeState: isExpanded 
                ? CrossFadeState.showSecond 
                : CrossFadeState.showFirst,
            duration: const Duration(milliseconds: 200),
          ),
        ],
      ),
    );
  }

  Widget _buildLogoContent(dynamic options, AppColorsExtension colors) {
    if (!options.logoOptions.enabled) {
      return Text(
        'Logo ထည့်ရန် toggle ကို ဖွင့်ပါ',
        style: TextStyle(fontSize: 12, color: colors.textTertiary),
      );
    }
    
    // Get opacity as int (matches LogoOptions model)
    final int opacityValue = options.logoOptions.opacity;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Upload button
        GestureDetector(
          onTap: () async {
            final ImagePicker picker = ImagePicker();
            final XFile? image = await picker.pickImage(source: ImageSource.gallery);
            if (image != null) {
              ref.read(videoCreationProvider.notifier).setLogoPath(image.path);
            }
          },
          child: Container(
            width: double.infinity,
            height: 120, // Slightly taller for preview
            decoration: BoxDecoration(
              color: colors.surfaceVariant,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: colors.border, style: BorderStyle.solid),
              image: options.logoOptions.localFilePath != null
                  ? DecorationImage(
                      image: FileImage(File(options.logoOptions.localFilePath!)),
                      fit: BoxFit.contain,
                    )
                  : null,
            ),
            child: options.logoOptions.localFilePath != null
                ? Stack(
                    children: [
                      Positioned(
                        right: 8,
                        top: 8,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Colors.black54,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.edit, color: Colors.white, size: 16),
                        ),
                      ),
                    ],
                  )
                : Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.cloud_upload_outlined, size: 32, color: Colors.white.withAlpha(100)),
                      const SizedBox(height: 8),
                      Text(
                        'Logo ရွေးရန် နှိပ်ပါ',
                        style: TextStyle(fontSize: 12, color: Colors.white.withAlpha(100)),
                      ),
                    ],
                  ),
          ),
        ),
        const SizedBox(height: 16),
        
        // Position selector
        Text('တည်နေရာ', style: TextStyle(fontSize: 12, color: Colors.white.withAlpha(150))),
        const SizedBox(height: 8),
        Row(
          children: [
            _buildPositionChip('top-left', '↖ ဘယ်အပေါ်', options.logoOptions.position),
            const SizedBox(width: 8),
            _buildPositionChip('top-right', '↗ ညာအပေါ်', options.logoOptions.position),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            _buildPositionChip('bottom-left', '↙ ဘယ်အောက်', options.logoOptions.position),
            const SizedBox(width: 8),
            _buildPositionChip('bottom-right', '↘ ညာအောက်', options.logoOptions.position),
          ],
        ),
        const SizedBox(height: 16),
        
        // Logo Size selector
        Text('Logo အရွယ်အစား', style: TextStyle(fontSize: 12, color: Colors.white.withAlpha(150))),
        const SizedBox(height: 8),
        Row(
          children: [
            _buildSizeChip('small', 'သေး', options.logoOptions.size),
            const SizedBox(width: 8),
            _buildSizeChip('medium', 'လတ်', options.logoOptions.size),
            const SizedBox(width: 8),
            _buildSizeChip('large', 'ကြီး', options.logoOptions.size),
          ],
        ),
        const SizedBox(height: 16),
        
        // Opacity slider - using int
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Opacity', style: TextStyle(fontSize: 12, color: Colors.white.withAlpha(150))),
            Text(
              '$opacityValue%',
              style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600),
            ),
          ],
        ),
        Slider(
          value: opacityValue.toDouble(),
          min: 10,
          max: 100,
          divisions: 9,
          activeColor: AppColors.primary,
          onChanged: (v) {
            final opts = options.logoOptions;
            ref.read(videoCreationProvider.notifier).updateLogoOptions(
              opts.copyWith(opacity: v.toInt()),
            );
          },
        ),
      ],
    );
  }

  Widget _buildPositionChip(String position, String label, String current) {
    final isSelected = current == position;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          final opts = ref.read(videoCreationProvider).options.logoOptions;
          ref.read(videoCreationProvider.notifier).updateLogoOptions(
            opts.copyWith(position: position),
          );
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primary.withAlpha(30) : const Color(0xFF2D2D2D),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: isSelected ? AppColors.primary : const Color(0xFF444444)),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 11,
                color: isSelected ? AppColors.primary : Colors.white70,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSizeChip(String size, String label, String current) {
    final isSelected = current == size;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          final opts = ref.read(videoCreationProvider).options.logoOptions;
          ref.read(videoCreationProvider.notifier).updateLogoOptions(
            opts.copyWith(size: size),
          );
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primary.withAlpha(30) : const Color(0xFF2D2D2D),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: isSelected ? AppColors.primary : const Color(0xFF444444)),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: isSelected ? AppColors.primary : Colors.white70,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildOutroContent(dynamic options, AppColorsExtension colors) {
    if (!options.outroOptions.enabled) {
      return Text(
        'Outro ထည့်ရန် toggle ကို ဖွင့်ပါ',
        style: TextStyle(fontSize: 12, color: colors.textTertiary),
      );
    }
    
    // Get durationSeconds as int (matches OutroOptions model)
    final int durationValue = options.outroOptions.durationSeconds;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Platform
        Text('Platform', style: TextStyle(fontSize: 12, color: Colors.white.withAlpha(150))),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            _buildPlatformChip('youtube', '📺 YouTube', options.outroOptions.platform),
            _buildPlatformChip('tiktok', '🎵 TikTok', options.outroOptions.platform),
            _buildPlatformChip('instagram', '📷 Instagram', options.outroOptions.platform),
          ],
        ),
        const SizedBox(height: 16),
        
        // Channel name
        Text('Channel Name', style: TextStyle(fontSize: 12, color: Colors.white.withAlpha(150))),
        const SizedBox(height: 8),
        TextFormField(
          initialValue: options.outroOptions.channelName,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          decoration: InputDecoration(
            hintText: 'Your Channel Name',
            hintStyle: TextStyle(color: Colors.white.withAlpha(80), fontSize: 13),
            filled: true,
            fillColor: const Color(0xFF2D2D2D),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFF444444)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFF444444)),
            ),
          ),
          onChanged: (value) {
            final opts = options.outroOptions;
            ref.read(videoCreationProvider.notifier).updateOutroOptions(
              opts.copyWith(channelName: value),
            );
          },
        ),
        const SizedBox(height: 16),
        
        // Duration - using durationSeconds as int
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Duration', style: TextStyle(fontSize: 12, color: Colors.white.withAlpha(150))),
            Text(
              '${durationValue}s',
              style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600),
            ),
          ],
        ),
        Slider(
          value: durationValue.toDouble(),
          min: 2,
          max: 10,
          divisions: 8,
          activeColor: AppColors.primary,
          onChanged: (v) {
            final opts = options.outroOptions;
            ref.read(videoCreationProvider.notifier).updateOutroOptions(
              opts.copyWith(durationSeconds: v.toInt()),
            );
          },
        ),
      ],
    );
  }

  Widget _buildPlatformChip(String platform, String label, String current) {
    final isSelected = current == platform;
    return GestureDetector(
      onTap: () {
        final opts = ref.read(videoCreationProvider).options.outroOptions;
        ref.read(videoCreationProvider.notifier).updateOutroOptions(
          opts.copyWith(platform: platform),
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary.withAlpha(30) : const Color(0xFF2D2D2D),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: isSelected ? AppColors.primary : const Color(0xFF444444)),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: isSelected ? AppColors.primary : Colors.white70,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildSummaryCard(dynamic options, AppColorsExtension colors) {
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
          Text(
            '📋 Video အကျဉ်းချုပ်',
            style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.w600, fontSize: 14),
          ),
          const SizedBox(height: 12),
          _buildSummaryRow('Voice', options.voiceId),
          _buildSummaryRow('Format', options.aspectRatio),
          _buildSummaryRow('Language', options.language == 'my' ? 'မြန်မာ' : 'English'),
          _buildSummaryRow('Subtitles', options.subtitleOptions.enabled ? 'Yes' : 'No'),
          _buildSummaryRow('Logo', options.logoOptions.enabled ? 'Yes' : 'No'),
          _buildSummaryRow('Outro', options.outroOptions.enabled ? 'Yes' : 'No'),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.white.withAlpha(120), fontSize: 12)),
          Text(value, style: const TextStyle(color: Colors.white, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildCreditCard(AppColorsExtension colors, AppStrings strings) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [colors.primary, colors.secondary],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF8B5CF6).withAlpha(40),
            blurRadius: 15,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFFFD700), Color(0xFFFFA500)],
              ),
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.amber.withAlpha(60),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: const Icon(Icons.bolt, color: Colors.white, size: 26),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Credit Cost',
                  style: TextStyle(color: Colors.white.withAlpha(180), fontSize: 12, fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 2),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: const [
                    Text(
                      '2',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(width: 4),
                    Text(
                      'Credits',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.green.withAlpha(40),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.green.withAlpha(80)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: const [
                Icon(Icons.check_circle, size: 14, color: Colors.green),
                SizedBox(width: 4),
                Text(
                  'Best Value',
                  style: TextStyle(color: Colors.green, fontSize: 11, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
