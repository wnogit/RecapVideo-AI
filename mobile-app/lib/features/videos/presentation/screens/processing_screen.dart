import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/api/video_service.dart';
import '../../../../core/providers/language_provider.dart';

/// Processing tips in both languages
const _processingTipsEN = [
  "💡 Add #shorts tag when uploading to TikTok",
  "💡 You can also upload to Facebook Reels",
  "💡 Credits are cheaper for ads",
  "💡 Share to Instagram Reels too",
  "💡 Download within 7 days",
  "💡 Almost done...",
];

const _processingTipsMM = [
  "💡 TikTok မှာ upload လုပ်တဲ့အခါ #shorts tag ထည့်ပေးပါ",
  "💡 Facebook Reels မှာလည်း ဒီ Video ကို တင်လို့ရပါတယ်",
  "💡 ကြော်ငြာအတွက် Credits ပိုသက်သာပါတယ်",
  "💡 Instagram Reels မှာလည်း share လုပ်နိုင်ပါတယ်",
  "💡 Video ပြီးရင် 7 ရက်အတွင်း download လုပ်ပါ",
  "💡 မကြာခင် ပြီးဆုံးတော့မှာပါ...",
];

/// Processing steps
class ProcessingStep {
  final String status;
  final String labelEN;
  final String labelMM;
  final String icon;

  const ProcessingStep(this.status, this.labelEN, this.labelMM, this.icon);
}

const _processingSteps = [
  ProcessingStep('pending', 'Waiting', 'စောင့်ဆိုင်းနေသည်', '⏳'),
  ProcessingStep('extracting_transcript', 'Analyzing', 'Video လေ့လာနေသည်', '🎬'),
  ProcessingStep('generating_script', 'Writing script', 'Script ရေးနေသည်', '✍️'),
  ProcessingStep('generating_audio', 'Recording audio', 'အသံသွင်းနေသည်', '🎙️'),
  ProcessingStep('rendering_video', 'Rendering', 'ပြင်ဆင်နေသည်', '🎨'),
  ProcessingStep('uploading', 'Almost done', 'မကြာခင် ပြီးပါပြီ', '☁️'),
];

/// Processing Screen
class ProcessingScreen extends ConsumerStatefulWidget {
  final String videoId;
  final String? title;
  final String? thumbnail;
  final VoidCallback? onCancel;
  final VoidCallback? onComplete;

  const ProcessingScreen({
    super.key,
    required this.videoId,
    this.title,
    this.thumbnail,
    this.onCancel,
    this.onComplete,
  });

  @override
  ConsumerState<ProcessingScreen> createState() => _ProcessingScreenState();
}

class _ProcessingScreenState extends ConsumerState<ProcessingScreen> {
  int _tipIndex = 0;
  String _status = 'pending';
  int _progress = 0;
  String? _statusMessage;
  bool _isPolling = true;

  @override
  void initState() {
    super.initState();
    _startTipRotation();
    _startPolling();
  }

  void _startTipRotation() {
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 5));
      if (!mounted) return false;
      setState(() => _tipIndex = (_tipIndex + 1) % _processingTipsEN.length);
      return _isPolling;
    });
  }

  void _startPolling() {
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 3));
      if (!mounted) return false;
      
      try {
        final videoService = ref.read(videoServiceProvider);
        final video = await videoService.getVideoStatus(widget.videoId);
        
        if (!mounted) return false;
        
        setState(() {
          _status = video.status;
          _progress = video.progressPercent;
          _statusMessage = video.statusMessage;
        });
        
        if (_status == 'completed') {
          _isPolling = false;
          widget.onComplete?.call();
          return false;
        }
        
        if (_status == 'failed' || _status == 'cancelled') {
          _isPolling = false;
          return false;
        }
      } catch (e) {
        debugPrint('Polling error: $e');
      }
      
      return _isPolling;
    });
  }

  @override
  void dispose() {
    _isPolling = false;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final lang = ref.watch(languageProvider);
    final isMMM = lang == AppLanguage.myanmar;
    final tips = isMMM ? _processingTipsMM : _processingTipsEN;
    final currentStepIndex = _processingSteps.indexWhere((s) => s.status == _status);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        title: Text(
          isMMM ? '🎬 Video ဖန်တီးနေပါတယ်' : '🎬 Processing Video',
          style: const TextStyle(color: Colors.white),
        ),
        centerTitle: true,
        automaticallyImplyLeading: false,
      ),
      body: Column(
        children: [
          // Preview
          if (widget.thumbnail != null)
            Container(
              margin: const EdgeInsets.all(16),
              height: 200,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                image: DecorationImage(
                  image: NetworkImage(widget.thumbnail!),
                  fit: BoxFit.cover,
                  colorFilter: ColorFilter.mode(Colors.black.withAlpha(100), BlendMode.darken),
                ),
              ),
              child: const Center(
                child: CircularProgressIndicator(color: Colors.white),
              ),
            ),

          // Title
          if (widget.title != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                widget.title!,
                style: const TextStyle(color: Colors.white70, fontSize: 14),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
              ),
            ),

          const SizedBox(height: 24),

          // Step Indicators
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              children: _processingSteps.asMap().entries.map((entry) {
                final index = entry.key;
                final step = entry.value;
                final isCompleted = index < currentStepIndex;
                final isCurrent = index == currentStepIndex;

                return Container(
                  padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                  margin: const EdgeInsets.only(bottom: 4),
                  decoration: BoxDecoration(
                    color: isCurrent ? AppColors.primary.withAlpha(30) : Colors.transparent,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      if (isCompleted)
                        const Icon(Icons.check_circle, color: Colors.green, size: 20)
                      else if (isCurrent)
                        const SizedBox(
                          width: 20, height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                        )
                      else
                        Icon(Icons.circle_outlined, color: Colors.grey.shade600, size: 20),
                      const SizedBox(width: 12),
                      Text(
                        '${step.icon} ${isMMM ? step.labelMM : step.labelEN}',
                        style: TextStyle(
                          color: isCompleted ? Colors.green : (isCurrent ? Colors.white : Colors.grey),
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
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: _progress / 100,
                    backgroundColor: const Color(0xFF2a2a3a),
                    valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
                    minHeight: 8,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('$_progress%', style: const TextStyle(color: Colors.white70, fontSize: 12)),
                    if (_statusMessage != null)
                      Text(_statusMessage!, style: const TextStyle(color: Colors.grey, fontSize: 11)),
                  ],
                ),
              ],
            ),
          ),

          const Spacer(),

          // Rotating Tip
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF1a1a2e),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Text('💡', style: TextStyle(fontSize: 16)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    tips[_tipIndex],
                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Cancel Button
          Padding(
            padding: const EdgeInsets.all(16),
            child: OutlinedButton.icon(
              onPressed: () {
                _isPolling = false;
                widget.onCancel?.call();
                Navigator.pop(context);
              },
              icon: const Icon(Icons.close),
              label: Text(isMMM ? 'ဖျက်သိမ်းမည်' : 'Cancel'),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.red,
                side: const BorderSide(color: Colors.red),
                minimumSize: const Size(double.infinity, 48),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
