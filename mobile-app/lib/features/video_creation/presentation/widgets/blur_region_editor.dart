import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../domain/entities/video_creation_options.dart';
import '../providers/video_creation_provider.dart';

/// Blur Region Editor Widget with preset positions and intensity slider
class BlurRegionEditor extends ConsumerWidget {
  const BlurRegionEditor({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(videoCreationProvider);
    final notifier = ref.read(videoCreationProvider.notifier);
    final regions = state.options.blurRegions;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Add Blur Buttons
        const Text(
          'Blur Box ထည့်ရန်',
          style: TextStyle(color: Colors.white70, fontSize: 12),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            _PresetButton(
              label: '↘️ ညာအောက်',
              onTap: () => _addRegion(notifier, 'bottom-right'),
            ),
            _PresetButton(
              label: '↙️ ဘယ်အောက်',
              onTap: () => _addRegion(notifier, 'bottom-left'),
            ),
            _PresetButton(
              label: '↗️ ညာအပေါ်',
              onTap: () => _addRegion(notifier, 'top-right'),
            ),
            _PresetButton(
              label: '↖️ ဘယ်အပေါ်',
              onTap: () => _addRegion(notifier, 'top-left'),
            ),
            _PresetButton(
              label: '⬜ Custom',
              onTap: () => _addRegion(notifier, 'custom'),
            ),
          ],
        ),

        // Region List
        if (regions.isNotEmpty) ...[
          const SizedBox(height: 16),
          Text(
            'Blur Regions (${regions.length})',
            style: const TextStyle(color: Colors.white70, fontSize: 12),
          ),
          const SizedBox(height: 8),
          ...regions.asMap().entries.map((entry) {
            final index = entry.key;
            final region = entry.value;
            return Container(
              margin: const EdgeInsets.only(bottom: 6),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFF2a2a3a),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.blur_on, size: 16, color: AppColors.primary),
                  const SizedBox(width: 8),
                  Text(
                    'Box ${index + 1}',
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '(${region.x.toInt()}%, ${region.y.toInt()}%)',
                    style: const TextStyle(color: Colors.grey, fontSize: 11),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => notifier.removeBlurRegion(region.id),
                    child: const Icon(Icons.delete_outline, size: 18, color: Colors.red),
                  ),
                ],
              ),
            );
          }),

          // Intensity Slider
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF1a1a2e),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF3a3a4a)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Blur Intensity', style: TextStyle(color: Colors.white, fontSize: 13)),
                    Text('${_getIntensity(regions).toInt()}', style: const TextStyle(color: AppColors.primary)),
                  ],
                ),
                const SizedBox(height: 8),
                Slider(
                  value: _getIntensity(regions),
                  min: 5,
                  max: 30,
                  divisions: 25,
                  activeColor: AppColors.primary,
                  inactiveColor: const Color(0xFF3a3a4a),
                  onChanged: (value) {
                    // Note: Intensity would be stored separately
                  },
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('အနည်းငယ်', style: TextStyle(color: Colors.grey.shade600, fontSize: 10)),
                    Text('အလွန်များ', style: TextStyle(color: Colors.grey.shade600, fontSize: 10)),
                  ],
                ),
              ],
            ),
          ),
        ],

        // Help Text
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: AppColors.primary.withAlpha(20),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              const Text('💡', style: TextStyle(fontSize: 14)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'YouTube watermark, logo ကို ဖုံးဖို့ blur box ထည့်ပါ။',
                  style: TextStyle(color: Colors.white.withAlpha(180), fontSize: 11),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  void _addRegion(VideoCreationNotifier notifier, String position) {
    // Just add a region - provider handles default position
    notifier.addBlurRegion();
    // TODO: Update provider to accept position params for preset positions
  }

  double _getIntensity(List<BlurRegion> regions) {
    return 15.0; // Default intensity
  }
}

/// Preset Button Widget
class _PresetButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _PresetButton({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFF2a2a3a),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFF3a3a4a)),
        ),
        child: Text(label, style: const TextStyle(color: Colors.white, fontSize: 12)),
      ),
    );
  }
}
