import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';

/// Processing Steps
const List<Map<String, String>> _processingSteps = [
  {'status': 'pending', 'label': 'စောင့်ဆိုင်းနေသည်', 'icon': '⏳'},
  {'status': 'extracting', 'label': 'Video လေ့လာနေသည်', 'icon': '🎬'},
  {'status': 'generating_script', 'label': 'Script ရေးနေသည်', 'icon': '✍️'},
  {'status': 'generating_audio', 'label': 'အသံသွင်းနေသည်', 'icon': '🎙️'},
  {'status': 'rendering', 'label': 'ပြင်ဆင်နေသည်', 'icon': '🎨'},
  {'status': 'uploading', 'label': 'မကြာခင် ပြီးပါပြီ', 'icon': '☁️'},
];

/// Rotating tips
const List<String> _tips = [
  '💡 TikTok မှာ upload လုပ်တဲ့အခါ #shorts tag ထည့်ပေးပါ',
  '💡 Facebook Reels မှာလည်း ဒီ Video ကို တင်လို့ရပါတယ်',
  '💡 Instagram Reels မှာလည်း share လုပ်နိုင်ပါတယ်',
  '💡 Video ပြီးရင် 7 ရက်အတွင်း download လုပ်ပါ',
  '💡 မကြာခင် ပြီးဆုံးတော့မှာပါ...',
];

/// Processing View Widget
class ProcessingViewWidget extends ConsumerStatefulWidget {
  final int progress;
  final String currentStatus;
  final VoidCallback onCancel;

  const ProcessingViewWidget({
    super.key,
    required this.progress,
    required this.currentStatus,
    required this.onCancel,
  });

  @override
  ConsumerState<ProcessingViewWidget> createState() => _ProcessingViewWidgetState();
}

class _ProcessingViewWidgetState extends ConsumerState<ProcessingViewWidget> {
  int _tipIndex = 0;

  @override
  void initState() {
    super.initState();
    _startTipRotation();
  }

  void _startTipRotation() {
    Future.delayed(const Duration(seconds: 5), () {
      if (mounted) {
        setState(() {
          _tipIndex = (_tipIndex + 1) % _tips.length;
        });
        _startTipRotation();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final currentStepIndex = _processingSteps.indexWhere(
      (s) => s['status'] == widget.currentStatus,
    );

    return Container(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          // Header
          const Text(
            '🎬 Video ဖန်တီးနေပါတယ်',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 32),

          // Step Indicators
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1a1a2e),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF333333)),
            ),
            child: Column(
              children: _processingSteps.asMap().entries.map((entry) {
                final index = entry.key;
                final step = entry.value;
                final isCompleted = index < currentStepIndex;
                final isCurrent = index == currentStepIndex;

                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    children: [
                      // Status Icon
                      Container(
                        width: 24,
                        height: 24,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isCompleted
                              ? Colors.green.withAlpha(40)
                              : isCurrent
                                  ? AppColors.primary.withAlpha(40)
                                  : Colors.white.withAlpha(10),
                        ),
                        child: Center(
                          child: isCompleted
                              ? const Icon(Icons.check, size: 14, color: Colors.green)
                              : isCurrent
                                  ? const SizedBox(
                                      width: 12,
                                      height: 12,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: AppColors.primary,
                                      ),
                                    )
                                  : Icon(Icons.circle, size: 8, color: Colors.white.withAlpha(40)),
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Label
                      Text(
                        '${step['icon']} ${step['label']}',
                        style: TextStyle(
                          fontSize: 14,
                          color: isCompleted
                              ? Colors.green
                              : isCurrent
                                  ? Colors.white
                                  : Colors.white38,
                          fontWeight: isCurrent ? FontWeight.w600 : FontWeight.normal,
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 24),

          // Progress Bar
          Column(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: widget.progress / 100,
                  minHeight: 8,
                  backgroundColor: const Color(0xFF333333),
                  valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
                ),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${widget.progress}% ပြီးပါပြီ',
                    style: const TextStyle(fontSize: 12, color: Colors.white70),
                  ),
                  Text(
                    '⏱️ ခန့်မှန်း: ~2 မိနစ်',
                    style: TextStyle(fontSize: 12, color: Colors.white.withAlpha(100)),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Rotating Tip
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.amber.withAlpha(20),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.amber.withAlpha(40)),
            ),
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              child: Text(
                _tips[_tipIndex],
                key: ValueKey(_tipIndex),
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: Colors.white70),
              ),
            ),
          ),
          const Spacer(),

          // Cancel Button
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: widget.onCancel,
              icon: const Icon(Icons.close, size: 18),
              label: const Text('ဖျက်သိမ်းမည်'),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.white70,
                side: const BorderSide(color: Color(0xFF444444)),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
