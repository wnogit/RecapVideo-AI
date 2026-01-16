import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../providers/video_creation_provider.dart';

/// Step 1 Input Widget - URL, Voice, Language, Format
class Step1InputWidget extends ConsumerStatefulWidget {
  const Step1InputWidget({super.key});

  @override
  ConsumerState<Step1InputWidget> createState() => _Step1InputWidgetState();
}

class _Step1InputWidgetState extends ConsumerState<Step1InputWidget> {
  final _urlController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Sync with provider
    final url = ref.read(videoCreationProvider).options.sourceUrl;
    _urlController.text = url;
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  Future<void> _pasteFromClipboard() async {
    final data = await Clipboard.getData(Clipboard.kTextPlain);
    if (data?.text != null) {
      _urlController.text = data!.text!;
      ref.read(videoCreationProvider.notifier).setSourceUrl(data.text!);
    }
  }

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
              const Text('🎬', style: TextStyle(fontSize: 20)),
              const SizedBox(width: 8),
              Text(
                'Video အချက်အလက်',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            'YouTube Shorts URL ထည့်ပြီး Voice ရွေးချယ်ပါ',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 20),

          // YouTube URL Input
          Text(
            'YouTube Shorts URL',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _urlController,
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'https://www.youtube.com/shorts/...',
                    hintStyle: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                    prefixIcon: Icon(Icons.link, color: AppColors.textSecondary, size: 20),
                    filled: false,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFF3a3a4a)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFF3a3a4a)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppColors.primary, width: 2),
                    ),
                  ),
                  onChanged: (value) {
                    ref.read(videoCreationProvider.notifier).setSourceUrl(value);
                  },
                ),
              ),
              const SizedBox(width: 8),
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF2a2a3a),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: IconButton(
                  icon: const Icon(Icons.content_paste, color: Colors.white70),
                  onPressed: _pasteFromClipboard,
                  tooltip: 'Paste',
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Output Language
          Text(
            'Output Language',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.transparent,
                    border: Border.all(color: const Color(0xFF3a3a4a)),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: DropdownButtonFormField<String>(
                    value: options.language,
                    isDense: true,
                    decoration: const InputDecoration(
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                      border: InputBorder.none,
                      filled: false,
                      prefixIcon: Padding(
                        padding: EdgeInsets.only(left: 12, right: 8),
                        child: Text('🇲🇲', style: TextStyle(fontSize: 18)),
                      ),
                      prefixIconConstraints: BoxConstraints(minWidth: 0, minHeight: 0),
                    ),
                    dropdownColor: const Color(0xFF1a1a2e),
                    style: const TextStyle(color: Colors.white, fontSize: 14),
                    icon: const Icon(Icons.keyboard_arrow_down, color: Colors.white54, size: 20),
                    items: const [
                      DropdownMenuItem(
                        value: 'my', 
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('🇲🇲 ', style: TextStyle(fontSize: 18)),
                            Text('မြန်မာ (Burmese)', style: TextStyle(color: Colors.white, fontSize: 14)),
                          ],
                        ),
                      ),
                      DropdownMenuItem(
                        value: 'en', 
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('🇬🇧 ', style: TextStyle(fontSize: 18)),
                            Text('English', style: TextStyle(color: Colors.white, fontSize: 14)),
                          ],
                        ),
                      ),
                    ],
                    selectedItemBuilder: (context) => const [
                      Text('မြန်မာ (Burmese)', style: TextStyle(color: Colors.white, fontSize: 14)),
                      Text('English', style: TextStyle(color: Colors.white, fontSize: 14)),
                    ],
                    onChanged: (value) {
                      if (value != null) {
                        ref.read(videoCreationProvider.notifier).setLanguage(value);
                      }
                    },
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Spacer to match paste button width
              const SizedBox(width: 48, height: 48),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Video ကို ဘာသာပြန်မည့် ဘာသာစကား ရွေးချယ်ပါ',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppColors.textSecondary,
              fontSize: 11,
            ),
          ),
          const SizedBox(height: 24),

          // Voice Selector
          Text(
            'Voice ရွေးချယ်ပါ',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildVoiceCard(
                  context,
                  name: 'Nilar',
                  subtitle: 'Female Voice',
                  emoji: '👩',
                  isSelected: options.voiceId == 'Nilar',
                  isPopular: true,
                  onTap: () => ref.read(videoCreationProvider.notifier).setVoiceId('Nilar'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildVoiceCard(
                  context,
                  name: 'Thiha',
                  subtitle: 'Male Voice',
                  emoji: '👨',
                  isSelected: options.voiceId == 'Thiha',
                  isPopular: false,
                  onTap: () => ref.read(videoCreationProvider.notifier).setVoiceId('Thiha'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Video Format
          Text(
            'Video Format',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _buildFormatChip(context, '9:16', 'Vertical', options.aspectRatio == '9:16'),
              _buildFormatChip(context, '16:9', 'Horizontal', options.aspectRatio == '16:9'),
              _buildFormatChip(context, '1:1', 'Square', options.aspectRatio == '1:1'),
              _buildFormatChip(context, '4:5', 'Portrait', options.aspectRatio == '4:5'),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            _getFormatHelperText(options.aspectRatio),
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppColors.textSecondary,
              fontSize: 11,
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildVoiceCard(
    BuildContext context, {
    required String name,
    required String subtitle,
    required String emoji,
    required bool isSelected,
    required bool isPopular,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary.withAlpha(30) : const Color(0xFF1a1a2e),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primary : const Color(0xFF3a3a4a),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(emoji, style: const TextStyle(fontSize: 28)),
                if (isPopular)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.orange.withAlpha(40),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text(
                      '🔥 Popular',
                      style: TextStyle(fontSize: 9, color: Colors.orange),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                    ),
                  ],
                ),
                const Spacer(),
                Icon(
                  Icons.volume_up,
                  size: 16,
                  color: AppColors.textSecondary,
                ),
                const Text(' Preview', style: TextStyle(fontSize: 10, color: Colors.white54)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFormatChip(BuildContext context, String ratio, String label, bool isSelected) {
    return GestureDetector(
      onTap: () => ref.read(videoCreationProvider.notifier).setAspectRatio(ratio),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary.withAlpha(30) : const Color(0xFF1a1a2e),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? AppColors.primary : const Color(0xFF3a3a4a),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              ratio == '9:16' ? Icons.stay_current_portrait :
              ratio == '16:9' ? Icons.stay_current_landscape :
              ratio == '1:1' ? Icons.crop_square :
              Icons.crop_portrait,
              size: 16,
              color: isSelected ? AppColors.primary : Colors.white70,
            ),
            const SizedBox(width: 6),
            Text(
              '$ratio $label',
              style: TextStyle(
                fontSize: 12,
                color: isSelected ? AppColors.primary : Colors.white70,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getFormatHelperText(String ratio) {
    switch (ratio) {
      case '16:9':
        return 'YouTube/Landscape ဗီဒီယို အတွက် အကြံပြုပါတယ်';
      case '1:1':
        return 'Instagram/Facebook Post အတွက် အကြံပြုပါတယ်';
      case '4:5':
        return 'Instagram Portrait Feed အတွက် အကြံပြုပါတယ်';
      case '9:16':
      default:
        return 'TikTok/Shorts အတွက် အကြံပြုပါတယ်';
    }
  }
}
