import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/api/video_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';

class VideoCard extends ConsumerWidget {
  final Video video;
  final VoidCallback onTap;

  const VideoCard({super.key, required this.video, required this.onTap});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = context.colors;
    final isCompleted = video.status == 'completed';
    
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: colors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: colors.border),
        ),
        child: Row(
          children: [
            // Thumbnail
            ClipRRect(
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                bottomLeft: Radius.circular(12),
              ),
              child: SizedBox(
                width: 100,
                height: 80,
                child: video.sourceThumbnail != null
                    ? Image.network(video.sourceThumbnail!, fit: BoxFit.cover, errorBuilder: (_, __, ___) => _buildPlaceholderThumb(colors))
                    : _buildPlaceholderThumb(colors),
              ),
            ),

            // Content
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(video.title, style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.w500, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 4),
                    Text(_formatDate(video.createdAt), style: TextStyle(color: colors.textSecondary, fontSize: 11)),
                    const SizedBox(height: 8),
                    // Status + Action Buttons Row
                    Row(
                      children: [
                        if (video.status == 'processing')
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.orange)),
                              const SizedBox(width: 6),
                              Text('Processing ${video.progressPercent}%', style: const TextStyle(color: Colors.orange, fontSize: 11)),
                            ],
                          )
                        else
                          _buildStatusBadge(video.status),
                        
                        const Spacer(),
                        
                        // Compact Action Buttons (only for completed)
                        if (isCompleted) ...[
                          _buildCompactActionButton(
                            icon: Icons.download_rounded,
                            color: colors.primary,
                            onTap: () => _handleDownload(context),
                          ),
                          const SizedBox(width: 8),
                          _buildCompactActionButton(
                            icon: Icons.share_rounded,
                            color: colors.info,
                            onTap: () => _handleShare(context),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ),

            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Icon(Icons.chevron_right, color: colors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildCompactActionButton({
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: color.withAlpha(25),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: color, size: 16),
      ),
    );
  }
  
  void _handleDownload(BuildContext context) {
    final colors = context.colors;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
            ),
            const SizedBox(width: 12),
            const Text('Downloading video...'),
          ],
        ),
        backgroundColor: colors.primary,
        duration: const Duration(seconds: 2),
      ),
    );
    // TODO: Implement actual download
  }
  
  void _handleShare(BuildContext context) {
    if (video.videoUrl != null) {
      final shareText = 'Check out my AI video: ${video.title}\n${video.videoUrl}';
      Clipboard.setData(ClipboardData(text: shareText));
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle, color: Colors.white, size: 18),
              const SizedBox(width: 8),
              const Text('Link copied to clipboard!'),
            ],
          ),
          backgroundColor: Colors.green,
          duration: const Duration(seconds: 2),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Video URL not available')),
      );
    }
  }

  Widget _buildPlaceholderThumb(AppColorsExtension colors) => Container(color: colors.surfaceVariant, child: Center(child: Icon(Icons.videocam, color: colors.textTertiary, size: 28)));

  Widget _buildStatusBadge(String status) {
    Color color;
    String label;
    switch (status) {
      case 'completed': color = Colors.green; label = 'Ready'; break;
      case 'failed': color = Colors.red; label = 'Failed'; break;
      default: color = Colors.grey; label = status;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: color.withAlpha(30), borderRadius: BorderRadius.circular(12)),
      child: Text(label, style: TextStyle(color: color, fontSize: 10)),
    );
  }

  String _formatDate(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 60) return '${diff.inMinutes} min ago';
    if (diff.inHours < 24) return '${diff.inHours} hours ago';
    return '${diff.inDays} days ago';
  }
}

