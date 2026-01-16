import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../providers/video_creation_provider.dart';

/// Step 2 - Video Styles: Copyright, Subtitles, Custom Blur
/// Uses Web-style collapsible sections with arrows
class Step2StylesWidget extends ConsumerStatefulWidget {
  const Step2StylesWidget({super.key});

  @override
  ConsumerState<Step2StylesWidget> createState() => _Step2StylesWidgetState();
}

class _Step2StylesWidgetState extends ConsumerState<Step2StylesWidget> {
  // Track which sections are expanded
  bool _copyrightExpanded = false;
  bool _blurExpanded = false;
  bool _subtitleExpanded = false;

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(videoCreationProvider);
    final options = state.options;

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Title
          Row(
            children: [
              const Text('🎨', style: TextStyle(fontSize: 20)),
              const SizedBox(width: 8),
              Text(
                'Video စတိုင်',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'Copyright ကာကွယ်ခြင်း၊ စာတန်း နှင့် Logo ရွေးချယ်ပါ',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 20),

          // 1. Copyright Protection - Collapsible
          _buildCollapsibleSection(
            icon: Icons.shield_outlined,
            iconColor: Colors.green,
            title: 'Copyright ကာကွယ်ခြင်း',
            subtitle: 'Video ကို ပိုဒ်အပ်ပြောင်းလဲ၍ ကာကွယ်ပါ',
            isExpanded: _copyrightExpanded,
            hasSwitch: false,
            onToggle: () => setState(() => _copyrightExpanded = !_copyrightExpanded),
            child: _buildCopyrightContent(options),
          ),
          const SizedBox(height: 12),

          // 2. Custom Blur - Collapsible
          _buildCollapsibleSection(
            icon: Icons.blur_on,
            iconColor: Colors.blue,
            title: 'Custom Blur',
            subtitle: 'Logo/watermark များကို ဖုံးထုန်',
            isExpanded: _blurExpanded,
            hasSwitch: false,
            onToggle: () => setState(() => _blurExpanded = !_blurExpanded),
            child: _buildBlurContent(options),
          ),
          const SizedBox(height: 12),

          // 3. Subtitles - Collapsible with Toggle
          _buildCollapsibleSection(
            icon: Icons.subtitles_outlined,
            iconColor: Colors.purple,
            title: 'စာတန်း (Subtitles)',
            subtitle: 'မြန်မာဘာသာ စာတန်း ထည့်မည်',
            isExpanded: _subtitleExpanded,
            hasSwitch: true,
            switchValue: options.subtitleOptions.enabled,
            onSwitchChanged: (value) {
              ref.read(videoCreationProvider.notifier).toggleSubtitles();
              if (value) setState(() => _subtitleExpanded = true);
            },
            onToggle: () => setState(() => _subtitleExpanded = !_subtitleExpanded),
            child: _buildSubtitleContent(options),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildCollapsibleSection({
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
        color: const Color(0xFF1A1A1A),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF333333)),
      ),
      child: Column(
        children: [
          // Header - Always visible
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
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          subtitle,
                          style: TextStyle(
                            color: Colors.white.withAlpha(120),
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
                      activeColor: AppColors.primary,
                    )
                  else
                    AnimatedRotation(
                      turns: isExpanded ? 0.5 : 0,
                      duration: const Duration(milliseconds: 200),
                      child: Icon(
                        Icons.keyboard_arrow_down,
                        color: Colors.white.withAlpha(150),
                        size: 24,
                      ),
                    ),
                ],
              ),
            ),
          ),
          // Expandable Content
          AnimatedCrossFade(
            firstChild: const SizedBox(width: double.infinity),
            secondChild: Column(
              children: [
                const Divider(height: 1, color: Color(0xFF333333)),
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

  Widget _buildCopyrightContent(dynamic options) {
    return Column(
      children: [
        _buildToggleRow(
          icon: Icons.palette_outlined,
          iconColor: Colors.orange,
          title: 'အရောင် ပြင်ဆင်ခြင်း',
          subtitle: 'Brightness, Contrast ပြောင်းမည်',
          value: options.copyrightOptions.colorAdjust,
          onChanged: (_) => ref.read(videoCreationProvider.notifier).toggleColorAdjust(),
        ),
        const SizedBox(height: 12),
        _buildToggleRow(
          icon: Icons.flip,
          iconColor: Colors.blue,
          title: 'အလျားလိုက်လှန်ခြင်း',
          subtitle: 'Video ကို ဘယ်ညာလှန်မည်',
          value: options.copyrightOptions.horizontalFlip,
          onChanged: (_) => ref.read(videoCreationProvider.notifier).toggleHorizontalFlip(),
        ),
        const SizedBox(height: 12),
        _buildToggleRow(
          icon: Icons.zoom_in,
          iconColor: Colors.green,
          title: 'အနည်းငယ် Zoom',
          subtitle: '5% Zoom ထည့်မည်',
          value: options.copyrightOptions.slightZoom,
          onChanged: (_) => ref.read(videoCreationProvider.notifier).toggleSlightZoom(),
        ),
        const SizedBox(height: 12),
        _buildToggleRow(
          icon: Icons.music_note,
          iconColor: Colors.pink,
          title: 'အသံ Pitch ပြောင်းခြင်း',
          subtitle: 'Audio pitch ပြောင်း (Copyright bypass)',
          value: options.copyrightOptions.audioPitchShift,
          onChanged: (_) => ref.read(videoCreationProvider.notifier).toggleAudioPitchShift(),
        ),
        if (options.copyrightOptions.audioPitchShift) ...[
          const SizedBox(height: 16),
          _buildSliderRow(
            label: 'Pitch Value',
            value: options.copyrightOptions.pitchValue,
            min: 0.5,
            max: 1.5,
            onChanged: (v) => ref.read(videoCreationProvider.notifier).setPitchValue(v),
          ),
        ],
      ],
    );
  }

  Widget _buildBlurContent(dynamic options) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Position preset buttons (like web)
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: [
            _buildBlurPresetButton('+ ညာအောက်ထောင့်', 'bottom-right'),
            _buildBlurPresetButton('+ ဘယ်အောက်ထောင့်', 'bottom-left'),
            _buildBlurPresetButton('+ ညာအပေါ်ထောင့်', 'top-right'),
            _buildBlurPresetButton('+ Custom', 'custom'),
          ],
        ),
        
        if (options.blurRegions.isNotEmpty) ...[
          const SizedBox(height: 12),
          Text(
            'Blur Regions (${options.blurRegions.length})',
            style: TextStyle(fontSize: 11, color: Colors.white.withAlpha(120)),
          ),
          const SizedBox(height: 8),
          ...options.blurRegions.map<Widget>((region) {
            final index = options.blurRegions.indexOf(region);
            return Container(
              margin: const EdgeInsets.only(bottom: 6),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFF2D2D2D),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF444444)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.blue.withAlpha(30),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Icon(Icons.blur_linear, size: 14, color: Colors.blue),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Box ${index + 1} (${region.x.toInt()}%, ${region.y.toInt()}%)',
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => ref.read(videoCreationProvider.notifier).removeBlurRegion(region.id),
                    child: const Icon(Icons.delete_outline, color: Colors.red, size: 18),
                  ),
                ],
              ),
            );
          }).toList(),
          
          // Blur Intensity Slider
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF2D2D2D),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFF444444)),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Blur Intensity', style: TextStyle(fontSize: 12, color: Colors.white.withAlpha(150))),
                    Text(
                      '${options.blurIntensity}',
                      style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
                Slider(
                  value: options.blurIntensity.toDouble(),
                  min: 5,
                  max: 30,
                  divisions: 25,
                  activeColor: AppColors.primary,
                  onChanged: (v) => ref.read(videoCreationProvider.notifier).setBlurIntensity(v.toInt()),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('အနည်းငယ်', style: TextStyle(fontSize: 10, color: Colors.white.withAlpha(80))),
                    Text('အလွန်များ', style: TextStyle(fontSize: 10, color: Colors.white.withAlpha(80))),
                  ],
                ),
              ],
            ),
          ),
        ] else ...[
          const SizedBox(height: 12),
          Text(
            '💡 YouTube watermark, logo ကို ဖုံးဖို့ blur box ထည့်ပါ',
            style: TextStyle(fontSize: 11, color: Colors.white.withAlpha(100)),
          ),
        ],
      ],
    );
  }
  
  Widget _buildBlurPresetButton(String label, String position) {
    return GestureDetector(
      onTap: () => ref.read(videoCreationProvider.notifier).addBlurAtPosition(position),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFF2D2D2D),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.primary.withAlpha(80)),
        ),
        child: Text(
          label,
          style: const TextStyle(fontSize: 11, color: AppColors.primary),
        ),
      ),
    );
  }

  Widget _buildSubtitleContent(dynamic options) {
    if (!options.subtitleOptions.enabled) {
      return Text(
        'စာတန်း ထည့်ရန် toggle ကို ဖွင့်ပါ',
        style: TextStyle(fontSize: 12, color: Colors.white.withAlpha(100)),
      );
    }
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Position
        Text('တည်နေရာ', style: TextStyle(fontSize: 12, color: Colors.white.withAlpha(150))),
        const SizedBox(height: 8),
        Row(
          children: [
            _buildChip('top', 'အပေါ်', options.subtitleOptions.position == 'top'),
            const SizedBox(width: 8),
            _buildChip('center', 'အလယ်', options.subtitleOptions.position == 'center'),
            const SizedBox(width: 8),
            _buildChip('bottom', 'အောက်', options.subtitleOptions.position == 'bottom'),
          ],
        ),
        const SizedBox(height: 16),
        
        // Size
        Text('အရွယ်အစား', style: TextStyle(fontSize: 12, color: Colors.white.withAlpha(150))),
        const SizedBox(height: 8),
        Row(
          children: [
            _buildSizeChip('small', 'သေး'),
            const SizedBox(width: 8),
            _buildSizeChip('medium', 'လတ်'),
            const SizedBox(width: 8),
            _buildSizeChip('large', 'ကြီး'),
          ],
        ),
        const SizedBox(height: 16),
        
        // Background Style (new)
        Text('နောက်ခံ Style', style: TextStyle(fontSize: 12, color: Colors.white.withAlpha(150))),
        const SizedBox(height: 8),
        Row(
          children: [
            _buildBackgroundChip('none', 'မရှိ', options.subtitleOptions.background),
            const SizedBox(width: 8),
            _buildBackgroundChip('semi', 'Glass', options.subtitleOptions.background),
            const SizedBox(width: 8),
            _buildBackgroundChip('solid', 'အပြည့်', options.subtitleOptions.background),
          ],
        ),
        const SizedBox(height: 16),
        
        // Text Color (new)
        Text('စာသား အရောင်', style: TextStyle(fontSize: 12, color: Colors.white.withAlpha(150))),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            _buildColorChip('#FFFFFF', Colors.white, options.subtitleOptions.color),
            _buildColorChip('#FFFF00', Colors.yellow, options.subtitleOptions.color),
            _buildColorChip('#00FF00', Colors.green, options.subtitleOptions.color),
            _buildColorChip('#00FFFF', Colors.cyan, options.subtitleOptions.color),
            _buildColorChip('#FF6B6B', Colors.red.shade300, options.subtitleOptions.color),
            _buildColorChip('#A855F7', const Color(0xFFA855F7), options.subtitleOptions.color),
          ],
        ),
      ],
    );
  }
  
  Widget _buildBackgroundChip(String value, String label, String current) {
    final isSelected = current == value;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          final opts = ref.read(videoCreationProvider).options.subtitleOptions;
          ref.read(videoCreationProvider.notifier).updateSubtitleOptions(
            opts.copyWith(background: value),
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
  
  Widget _buildColorChip(String hexColor, Color color, String current) {
    final isSelected = current == hexColor;
    return GestureDetector(
      onTap: () {
        final opts = ref.read(videoCreationProvider).options.subtitleOptions;
        ref.read(videoCreationProvider.notifier).updateSubtitleOptions(
          opts.copyWith(color: hexColor),
        );
      },
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? AppColors.primary : Colors.white24,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: isSelected
            ? const Center(child: Icon(Icons.check, size: 16, color: Colors.black))
            : null,
      ),
    );
  }

  Widget _buildToggleRow({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: iconColor.withAlpha(25),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 16, color: iconColor),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(color: Colors.white, fontSize: 13)),
              Text(subtitle, style: TextStyle(fontSize: 10, color: Colors.white.withAlpha(100))),
            ],
          ),
        ),
        Switch(
          value: value,
          onChanged: onChanged,
          activeColor: AppColors.primary,
          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
        ),
      ],
    );
  }

  Widget _buildSliderRow({
    required String label,
    required double value,
    required double min,
    required double max,
    required ValueChanged<double> onChanged,
  }) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: TextStyle(fontSize: 12, color: Colors.white.withAlpha(150))),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.primary.withAlpha(30),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                '${value.toStringAsFixed(1)}x',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 12),
              ),
            ),
          ],
        ),
        Slider(
          value: value,
          min: min,
          max: max,
          divisions: 10,
          activeColor: AppColors.primary,
          onChanged: onChanged,
        ),
      ],
    );
  }

  Widget _buildChip(String position, String label, bool isSelected) {
    return GestureDetector(
      onTap: () {
        final opts = ref.read(videoCreationProvider).options.subtitleOptions;
        ref.read(videoCreationProvider.notifier).updateSubtitleOptions(
          opts.copyWith(position: position),
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

  Widget _buildSizeChip(String size, String label) {
    final current = ref.watch(videoCreationProvider).options.subtitleOptions.size;
    final isSelected = current == size;
    return GestureDetector(
      onTap: () {
        final opts = ref.read(videoCreationProvider).options.subtitleOptions;
        ref.read(videoCreationProvider.notifier).updateSubtitleOptions(
          opts.copyWith(size: size),
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
}
