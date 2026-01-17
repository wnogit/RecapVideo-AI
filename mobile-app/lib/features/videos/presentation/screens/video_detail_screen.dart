import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:video_player/video_player.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/api/video_service.dart';

/// Video Detail Screen - Shows video player, title, and actions
class VideoDetailScreen extends ConsumerStatefulWidget {
  final String videoId;
  final String? title;
  final String? thumbnailUrl;
  final String? videoUrl;
  final String status;
  final Video? video; // Full video object for detailed info

  const VideoDetailScreen({
    super.key,
    required this.videoId,
    this.title,
    this.thumbnailUrl,
    this.videoUrl,
    required this.status,
    this.video,
  });

  @override
  ConsumerState<VideoDetailScreen> createState() => _VideoDetailScreenState();
}

class _VideoDetailScreenState extends ConsumerState<VideoDetailScreen> {
  VideoPlayerController? _controller;
  bool _initialized = false;
  bool _isPlaying = false;

  @override
  void initState() {
    super.initState();
    if (widget.videoUrl != null && widget.status == 'completed') {
      _initializePlayer();
    }
  }

  Future<void> _initializePlayer() async {
    _controller = VideoPlayerController.networkUrl(Uri.parse(widget.videoUrl!));
    try {
      await _controller!.initialize();
      setState(() {
        _initialized = true;
      });
      _controller!.addListener(() {
         if (mounted) {
           setState(() {
             _isPlaying = _controller!.value.isPlaying;
           });
         }
      });
    } catch (e) {
      debugPrint('Error initializing video player: $e');
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  void _togglePlay() {
    if (_controller == null || !_initialized) return;
    if (_isPlaying) {
      _controller!.pause();
    } else {
      _controller!.play();
    }
  }

  /// Duration ကို mm:ss format ပြောင်းရန်
  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds = duration.inSeconds.remainder(60).toString().padLeft(2, '0');
    if (duration.inHours > 0) {
      final hours = duration.inHours.toString();
      return '$hours:$minutes:$seconds';
    }
    return '$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    final isReady = widget.status == 'completed' && widget.videoUrl != null;
    final colors = context.colors;
    final strings = ref.watch(stringsProvider);

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        backgroundColor: colors.background,
        elevation: 0,
        title: Text(strings.isEnglish ? 'Video Details' : 'ဗီဒီယို အသေးစိတ်', style: TextStyle(color: colors.textPrimary)),
        iconTheme: IconThemeData(color: colors.textPrimary),
        actions: [
          IconButton(
            icon: const Icon(Icons.more_vert),
            onPressed: () => _showOptionsSheet(context, colors, strings),
          ),
        ],
      ),
      body: Column(
        children: [
          // Video Player / Preview
          // Constrained height to avoid taking up full screen
          Container(
            constraints: const BoxConstraints(maxHeight: 450),
            child: AspectRatio(
              aspectRatio: _controller?.value.aspectRatio ?? 9 / 16,
              child: Container(
                decoration: BoxDecoration(
                  color: colors.surface,
                  borderRadius: BorderRadius.circular(12),
                ),
                margin: const EdgeInsets.all(16),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      // Video Player or Thumbnail
                      if (_initialized && _controller != null)
                        VideoPlayer(_controller!)
                      else if (widget.thumbnailUrl != null)
                        Image.network(
                          widget.thumbnailUrl!,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => _buildPlaceholder(colors),
                        )
                      else
                        _buildPlaceholder(colors),

                      // Tap area for controls toggle
                      if (_initialized)
                        Positioned.fill(
                          child: GestureDetector(
                            onTap: _togglePlay,
                            behavior: HitTestBehavior.translucent,
                            child: const SizedBox(),
                          ),
                        ),

                      // Play/Pause overlay (Center)
                      if (isReady)
                        Center(
                          child: GestureDetector(
                            onTap: _togglePlay,
                            child: AnimatedOpacity(
                              opacity: _isPlaying ? 0.0 : 1.0,
                              duration: const Duration(milliseconds: 200),
                              child: Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: Colors.black54,
                                  borderRadius: BorderRadius.circular(50),
                                ),
                                child: Icon(
                                  _isPlaying ? Icons.pause : Icons.play_arrow,
                                  size: 48,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ),

                      // Video Controls (Bottom) - Progress bar + Duration
                      if (_initialized && _controller != null)
                        Positioned(
                          left: 0,
                          right: 0,
                          bottom: 0,
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.bottomCenter,
                                end: Alignment.topCenter,
                                colors: [
                                  Colors.black.withAlpha(180),
                                  Colors.transparent,
                                ],
                              ),
                            ),
                            padding: const EdgeInsets.fromLTRB(12, 24, 12, 8),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                // Seek bar (Progress Indicator)
                                VideoProgressIndicator(
                                  _controller!,
                                  allowScrubbing: true,
                                  colors: VideoProgressColors(
                                    playedColor: colors.primary,
                                    bufferedColor: Colors.white24,
                                    backgroundColor: Colors.white10,
                                  ),
                                  padding: EdgeInsets.zero,
                                ),
                                const SizedBox(height: 6),
                                // Duration labels
                                ValueListenableBuilder<VideoPlayerValue>(
                                  valueListenable: _controller!,
                                  builder: (context, value, child) {
                                    return Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        // Current position
                                        Text(
                                          _formatDuration(value.position),
                                          style: const TextStyle(
                                            color: Colors.white70,
                                            fontSize: 11,
                                          ),
                                        ),
                                        // Total duration
                                        Text(
                                          _formatDuration(value.duration),
                                          style: const TextStyle(
                                            color: Colors.white70,
                                            fontSize: 11,
                                          ),
                                        ),
                                      ],
                                    );
                                  },
                                ),
                              ],
                            ),
                          ),
                        ),

                      // Status overlay for non-ready videos
                      if (!isReady)
                        Container(
                          color: Colors.black54,
                          child: Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                if (widget.status == 'processing')
                                  const CircularProgressIndicator(color: Colors.orange)
                                else if (widget.status == 'failed')
                                  const Icon(Icons.error, size: 48, color: Colors.red),
                                const SizedBox(height: 12),
                                Text(
                                  widget.status == 'processing' ? strings.processing : strings.failed,
                                  style: TextStyle(
                                    color: widget.status == 'processing' ? Colors.orange : Colors.red,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ),

                  // Video Info Section
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Title
                          Text(
                            widget.title ?? (strings.isEnglish ? 'Untitled Video' : 'ခေါင်းစဉ်မရှိ'),
                            style: TextStyle(
                              color: colors.textPrimary,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),

                          // Status badge with Download/Share buttons
                          Row(
                            children: [
                              _buildStatusBadge(widget.status, strings),
                              const Spacer(),
                              if (isReady) ...[
                                _buildSmallActionButton(
                                  icon: Icons.download_rounded,
                                  color: colors.primary,
                                  onTap: () {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text(strings.downloading)),
                                    );
                                  },
                                ),
                                const SizedBox(width: 8),
                                _buildSmallActionButton(
                                  icon: Icons.share_rounded,
                                  color: Colors.blue,
                                  onTap: () {
                                    // TODO: Share video
                                  },
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 16),

                          // Video Info Card (Primary Content)
                          if (isReady) _buildVideoInfoCard(colors, strings),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            );
          }

          Widget _buildPlaceholder(AppColorsExtension colors) {
            return Container(
              color: colors.surfaceVariant,
              child: Center(
                child: Icon(Icons.videocam, size: 48, color: colors.textTertiary),
              ),
            );
          }

          Widget _buildStatusBadge(String status, AppStrings strings) {
            Color color;
            String label;
            IconData icon;

            switch (status) {
              case 'completed':
                color = Colors.green;
                label = strings.videoReady;
                icon = Icons.check_circle;
                break;
              case 'processing':
                color = Colors.orange;
                label = strings.processing;
                icon = Icons.hourglass_top;
                break;
              case 'failed':
                color = Colors.red;
                label = strings.failed;
                icon = Icons.error;
                break;
              default:
                color = Colors.grey;
                label = strings.isEnglish ? 'Unknown' : 'မသိရှိ';
                icon = Icons.help;
            }

            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: color.withAlpha(30),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(icon, size: 16, color: color),
                  const SizedBox(width: 6),
                  Text(label, style: TextStyle(color: color, fontSize: 13)),
                ],
              ),
            );
          }

          /// Video Info Card - Displays metadata
          Widget _buildVideoInfoCard(AppColorsExtension colors, AppStrings strings) {
            // Get duration from video controller or video object
            Duration duration = _controller?.value.duration ?? Duration.zero;
            if (duration == Duration.zero && widget.video?.durationSeconds != null) {
              duration = Duration(seconds: widget.video!.durationSeconds!);
            }
            final durationStr = _formatDuration(duration);
            
            // Get actual data from video object
            final video = widget.video;
            final fileSize = video?.formattedFileSize ?? '-';
            final createdDate = video?.createdAt.toString().split(' ')[0] ?? '-';
            final voice = video?.getVoiceDisplayName(strings.isEnglish) ?? '-';
            final aspectRatio = video?.getAspectRatioDisplay() ?? '-';
            
            return Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: colors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: colors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header
                  Row(
                    children: [
                      Icon(Icons.info_outline, color: colors.textSecondary, size: 18),
                      const SizedBox(width: 8),
                      Text(
                        strings.isEnglish ? 'Video Info' : 'ဗီဒီယို အချက်အလက်',
                        style: TextStyle(
                          color: colors.textSecondary,
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  // Info Grid
                  Row(
                    children: [
                      // Duration
                      Expanded(child: _buildInfoItem(strings.isEnglish ? '⏱ Duration' : '⏱ ကြာချိန်', durationStr, colors)),
                      // File Size
                      Expanded(child: _buildInfoItem(strings.isEnglish ? '📦 File Size' : '📦 ဖိုင်အရွယ်', fileSize, colors)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      // Created Date
                      Expanded(child: _buildInfoItem(strings.isEnglish ? '📅 Created' : '📅 ဖန်တီးခဲ့သည်', createdDate, colors)),
                      // Voice
                      Expanded(child: _buildInfoItem(strings.isEnglish ? '🎙 Voice' : '🎙 အသံ', voice, colors)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      // Aspect Ratio
                      Expanded(child: _buildInfoItem(strings.isEnglish ? '📐 Format' : '📐 ဖော်မက်', aspectRatio, colors)),
                      const Expanded(child: SizedBox()),
                    ],
                  ),
                ],
              ),
            );
          }
          
          /// Single info item in the card
          Widget _buildInfoItem(String label, String value, AppColorsExtension colors) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    color: colors.textTertiary,
                    fontSize: 11,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: TextStyle(
                    color: colors.textPrimary,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            );
          }
          
          /// Compact action button
          Widget _buildCompactButton({
            required IconData icon,
            required String label,
            required Color color,
            required VoidCallback onTap,
          }) {
            return GestureDetector(
              onTap: onTap,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: color.withAlpha(20),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: color.withAlpha(50)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(icon, color: color, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      label,
                      style: TextStyle(
                        color: color,
                        fontWeight: FontWeight.w500,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          /// Floating action button for video overlay
          Widget _buildFloatingActionButton({
            required IconData icon,
            required Color color,
            required VoidCallback onTap,
          }) {
            return GestureDetector(
              onTap: onTap,
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.black.withAlpha(150),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white24),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
            );
          }

          /// Small action button next to status badge
          Widget _buildSmallActionButton({
            required IconData icon,
            required Color color,
            required VoidCallback onTap,
          }) {
            return GestureDetector(
              onTap: onTap,
              child: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: color.withAlpha(25),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: color, size: 18),
              ),
            );
          }

          Widget _buildActionButton(
            BuildContext context, {
            required IconData icon,
            required String label,
            required Color color,
            required VoidCallback onTap,
          }) {
            return GestureDetector(
              onTap: onTap,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: color.withAlpha(20),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: color.withAlpha(50)),
                ),
                child: Row(
                  children: [
                    Icon(icon, color: color),
                    const SizedBox(width: 12),
                    Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w500)),
                    const Spacer(),
                    Icon(Icons.chevron_right, color: color.withAlpha(150)),
                  ],
                ),
              ),
            );
          }

          void _showOptionsSheet(BuildContext context, AppColorsExtension colors, AppStrings strings) {
            showModalBottomSheet(
              context: context,
              backgroundColor: colors.surface,
              shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
              ),
              builder: (context) => Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: colors.textTertiary,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(height: 20),
                    ListTile(
                      leading: Icon(Icons.info_outline, color: colors.textSecondary),
                      title: Text(strings.isEnglish ? 'Video Info' : 'ဗီဒီယို အချက်အလက်', style: TextStyle(color: colors.textPrimary)),
                      onTap: () => Navigator.pop(context),
                    ),
                    ListTile(
                      leading: Icon(Icons.refresh, color: colors.textSecondary),
                      title: Text(strings.isEnglish ? 'Retry Processing' : 'ပြန်လုပ်ရန်', style: TextStyle(color: colors.textPrimary)),
                      onTap: () => Navigator.pop(context),
                    ),
                    ListTile(
                      leading: const Icon(Icons.delete, color: Colors.red),
                      title: Text(strings.delete, style: const TextStyle(color: Colors.red)),
                      onTap: () {
                        Navigator.pop(context);
                        _confirmDelete(context, colors, strings);
                      },
                    ),
                  ],
                ),
              ),
            );
          }

          void _confirmDelete(BuildContext context, AppColorsExtension colors, AppStrings strings) {
            showDialog(
              context: context,
              builder: (context) => AlertDialog(
                backgroundColor: colors.surface,
                title: Text(strings.isEnglish ? 'Delete Video?' : 'ဗီဒီယို ဖျက်မလား?', style: TextStyle(color: colors.textPrimary)),
                content: Text(
                  strings.isEnglish 
                    ? 'This action cannot be undone. Are you sure you want to delete this video?'
                    : 'ဒီလုပ်ဆောင်ချက်ကို ပြန်ပြင်၍မရပါ။ ဒီဗီဒီယိုကို ဖျက်ချင်တာ သေချာပါသလား?',
                  style: TextStyle(color: colors.textSecondary),
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: Text(strings.cancel),
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.pop(context);
                      Navigator.pop(context);
                      // TODO: Call delete API
                    },
                    child: Text(strings.delete, style: const TextStyle(color: Colors.red)),
                  ),
                ],
              ),
            );
          }
}
