import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:video_player/video_player.dart';
import '../../../../core/constants/app_colors.dart';

/// Video Detail Screen - Shows video player, title, and actions
class VideoDetailScreen extends ConsumerStatefulWidget {
  final String videoId;
  final String? title;
  final String? thumbnailUrl;
  final String? videoUrl;
  final String status;

  const VideoDetailScreen({
    super.key,
    required this.videoId,
    this.title,
    this.thumbnailUrl,
    this.videoUrl,
    required this.status,
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

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        title: const Text('Video Details', style: TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: const Icon(Icons.more_vert),
            onPressed: () => _showOptionsSheet(context),
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
                  color: const Color(0xFF1a1a2e),
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
                          errorBuilder: (_, __, ___) => _buildPlaceholder(),
                        )
                      else
                        _buildPlaceholder(),

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
                                  colors: const VideoProgressColors(
                                    playedColor: AppColors.primary,
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
                                  widget.status == 'processing' ? 'Processing...' : 'Failed',
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
                            widget.title ?? 'Untitled Video',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),

                          // Status badge
                          _buildStatusBadge(widget.status),
                          const SizedBox(height: 16),

                          // Video Info Card (Primary Content)
                          if (isReady) _buildVideoInfoCard(),
                          
                          const SizedBox(height: 16),

                          // Compact Action Buttons (Download + Share)
                          if (isReady)
                            Row(
                              children: [
                                // Download Button (Compact)
                                Expanded(
                                  child: _buildCompactButton(
                                    icon: Icons.download,
                                    label: 'Download',
                                    color: AppColors.primary,
                                    onTap: () {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(content: Text('Downloading...')),
                                      );
                                    },
                                  ),
                                ),
                                const SizedBox(width: 12),
                                // Share Button (Compact)
                                Expanded(
                                  child: _buildCompactButton(
                                    icon: Icons.share,
                                    label: 'Share',
                                    color: Colors.blue,
                                    onTap: () {
                                      // TODO: Share video
                                    },
                                  ),
                                ),
                              ],
                            ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            );
          }

          Widget _buildPlaceholder() {
            return Container(
              color: const Color(0xFF2a2a3a),
              child: const Center(
                child: Icon(Icons.videocam, size: 48, color: Colors.white24),
              ),
            );
          }

          Widget _buildStatusBadge(String status) {
            Color color;
            String label;
            IconData icon;

            switch (status) {
              case 'completed':
                color = Colors.green;
                label = 'Ready to Download';
                icon = Icons.check_circle;
                break;
              case 'processing':
                color = Colors.orange;
                label = 'Processing...';
                icon = Icons.hourglass_top;
                break;
              case 'failed':
                color = Colors.red;
                label = 'Processing Failed';
                icon = Icons.error;
                break;
              default:
                color = Colors.grey;
                label = 'Unknown';
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
          Widget _buildVideoInfoCard() {
            // Get duration from video controller
            final duration = _controller?.value.duration ?? Duration.zero;
            final durationStr = _formatDuration(duration);
            
            // TODO: Get these from actual video data API
            const fileSize = '12.5 MB'; // Placeholder
            final createdDate = DateTime.now().toString().split(' ')[0];
            const voice = 'Myanmar Female';
            const style = 'Professional';
            
            return Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1a1a2e),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withAlpha(20)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header
                  Row(
                    children: [
                      Icon(Icons.info_outline, color: Colors.white.withAlpha(150), size: 18),
                      const SizedBox(width: 8),
                      Text(
                        'Video Info',
                        style: TextStyle(
                          color: Colors.white.withAlpha(200),
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
                      Expanded(child: _buildInfoItem('⏱ Duration', durationStr)),
                      // File Size
                      Expanded(child: _buildInfoItem('📦 File Size', fileSize)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      // Created Date
                      Expanded(child: _buildInfoItem('📅 Created', createdDate)),
                      // Voice
                      Expanded(child: _buildInfoItem('🎙 Voice', voice)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      // Style
                      Expanded(child: _buildInfoItem('🎨 Style', style)),
                      const Expanded(child: SizedBox()),
                    ],
                  ),
                ],
              ),
            );
          }
          
          /// Single info item in the card
          Widget _buildInfoItem(String label, String value) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    color: Colors.white.withAlpha(100),
                    fontSize: 11,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: const TextStyle(
                    color: Colors.white,
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

          void _showOptionsSheet(BuildContext context) {
            showModalBottomSheet(
              context: context,
              backgroundColor: const Color(0xFF1a1a2e),
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
                        color: Colors.white30,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(height: 20),
                    ListTile(
                      leading: const Icon(Icons.info_outline, color: Colors.white70),
                      title: const Text('Video Info', style: TextStyle(color: Colors.white)),
                      onTap: () => Navigator.pop(context),
                    ),
                    ListTile(
                      leading: const Icon(Icons.refresh, color: Colors.white70),
                      title: const Text('Retry Processing', style: TextStyle(color: Colors.white)),
                      onTap: () => Navigator.pop(context),
                    ),
                    ListTile(
                      leading: const Icon(Icons.delete, color: Colors.red),
                      title: const Text('Delete', style: TextStyle(color: Colors.red)),
                      onTap: () {
                        Navigator.pop(context);
                        _confirmDelete(context);
                      },
                    ),
                  ],
                ),
              ),
            );
          }

          void _confirmDelete(BuildContext context) {
            showDialog(
              context: context,
              builder: (context) => AlertDialog(
                backgroundColor: const Color(0xFF1a1a2e),
                title: const Text('Delete Video?', style: TextStyle(color: Colors.white)),
                content: const Text(
                  'This action cannot be undone. Are you sure you want to delete this video?',
                  style: TextStyle(color: Colors.white70),
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Cancel'),
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.pop(context);
                      Navigator.pop(context);
                      // TODO: Call delete API
                    },
                    child: const Text('Delete', style: TextStyle(color: Colors.red)),
                  ),
                ],
              ),
            );
          }
}
