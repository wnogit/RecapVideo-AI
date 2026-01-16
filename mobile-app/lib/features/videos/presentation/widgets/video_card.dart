import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../../core/api/video_service.dart';
import '../../../../core/constants/app_colors.dart';

class VideoCard extends StatelessWidget {
  final Video video;
  final VoidCallback onTap;

  const VideoCard({super.key, required this.video, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isCompleted = video.status == 'completed';
    
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF1a1a2e),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFF3a3a4a)),
        ),
        child: Column(
          children: [
            // Main Row: Thumbnail + Content
            Row(
              children: [
                // Thumbnail
                ClipRRect(
                  borderRadius: BorderRadius.only(
                    topLeft: const Radius.circular(12),
                    bottomLeft: Radius.circular(isCompleted ? 0 : 12),
                  ),
                  child: SizedBox(
                    width: 100,
                    height: 80,
                    child: video.sourceThumbnail != null
                        ? Image.network(video.sourceThumbnail!, fit: BoxFit.cover, errorBuilder: (_, __, ___) => _buildPlaceholderThumb())
                        : _buildPlaceholderThumb(),
                  ),
                ),

                // Content
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(video.title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w500, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
                        const SizedBox(height: 4),
                        Text(_formatDate(video.createdAt), style: TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                        const SizedBox(height: 8),
                        if (video.status == 'processing')
                          Row(
                            children: [
                              const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.orange)),
                              const SizedBox(width: 6),
                              Text('Processing ${video.progressPercent}%', style: const TextStyle(color: Colors.orange, fontSize: 11)),
                            ],
                          )
                        else
                          _buildStatusBadge(video.status),
                      ],
                    ),
                  ),
                ),

                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: Icon(Icons.chevron_right, color: Colors.white54),
                ),
              ],
            ),
            
            // Action Buttons Row (only for completed videos)
            if (isCompleted)
              Container(
                decoration: BoxDecoration(
                  border: Border(
                    top: BorderSide(color: Colors.white.withAlpha(20)),
                  ),
                ),
                child: Row(
                  children: [
                    // Download Button
                    Expanded(
                      child: InkWell(
                        onTap: () => _handleDownload(context),
                        borderRadius: const BorderRadius.only(
                          bottomLeft: Radius.circular(12),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.download_rounded, color: AppColors.primary, size: 18),
                              const SizedBox(width: 6),
                              Text(
                                'Download',
                                style: TextStyle(
                                  color: AppColors.primary,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    
                    // Divider
                    Container(
                      width: 1,
                      height: 30,
                      color: Colors.white.withAlpha(20),
                    ),
                    
                    // Share Button
                    Expanded(
                      child: InkWell(
                        onTap: () => _handleShare(context),
                        borderRadius: const BorderRadius.only(
                          bottomRight: Radius.circular(12),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.share_rounded, color: Colors.blue, size: 18),
                              const SizedBox(width: 6),
                              Text(
                                'Share',
                                style: TextStyle(
                                  color: Colors.blue,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
  
  void _handleDownload(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
            ),
            const SizedBox(width: 12),
            const Text('Downloading video...'),
          ],
        ),
        backgroundColor: AppColors.primary,
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
              Icon(Icons.check_circle, color: Colors.white, size: 18),
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

  Widget _buildPlaceholderThumb() => Container(color: const Color(0xFF2a2a3a), child: const Center(child: Icon(Icons.videocam, color: Colors.white24, size: 28)));

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

