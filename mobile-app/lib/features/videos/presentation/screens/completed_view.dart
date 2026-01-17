import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/providers/language_provider.dart';

/// Completed View - shown after video processing is done
class CompletedView extends ConsumerWidget {
  final String videoId;
  final String videoUrl;
  final String? thumbnailUrl;
  final String title;
  final String? duration;
  final List<String> appliedFeatures;
  final VoidCallback? onDownload;
  final VoidCallback? onDownloadThumbnail;
  final VoidCallback? onCreateAnother;
  final VoidCallback? onShare;

  const CompletedView({
    super.key,
    required this.videoId,
    required this.videoUrl,
    this.thumbnailUrl,
    required this.title,
    this.duration,
    this.appliedFeatures = const [],
    this.onDownload,
    this.onDownloadThumbnail,
    this.onCreateAnother,
    this.onShare,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final lang = ref.watch(languageProvider);
    final isMM = lang == AppLanguage.myanmar;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              // Success Header
              const SizedBox(height: 24),
              const Text('🎉', style: TextStyle(fontSize: 48)),
              const SizedBox(height: 12),
              Text(
                isMM ? 'ပြီးပါပြီ!' : 'Completed!',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 24),

              // Video Player
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withAlpha(40),
                      blurRadius: 20,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: AspectRatio(
                    aspectRatio: 9 / 16,
                    child: Stack(
                      children: [
                        // Thumbnail or gradient
                        if (thumbnailUrl != null)
                          Image.network(
                            thumbnailUrl!,
                            fit: BoxFit.cover,
                            width: double.infinity,
                            height: double.infinity,
                          )
                        else
                          Container(
                            decoration: const BoxDecoration(
                              gradient: LinearGradient(
                                colors: [Color(0xFF8B5CF6), Color(0xFFEC4899)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                            ),
                          ),
                        // Play button overlay
                        Center(
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.black.withAlpha(150),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.play_arrow_rounded,
                              color: Colors.white,
                              size: 48,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Title
              Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              if (duration != null)
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    '⏱️ $duration',
                    style: const TextStyle(color: Colors.grey, fontSize: 13),
                  ),
                ),
              const SizedBox(height: 24),

              // Download Buttons
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: onDownload,
                  icon: const Icon(Icons.download),
                  label: Text(isMM ? '⬇️ Video ဒေါင်းလုပ်မည်' : '⬇️ Download Video'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              if (onDownloadThumbnail != null)
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: onDownloadThumbnail,
                    icon: const Icon(Icons.image_outlined),
                    label: Text(isMM ? '🖼️ Thumbnail ဒေါင်းမည်' : '🖼️ Download Thumbnail'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white70,
                      side: const BorderSide(color: Color(0xFF3a3a4a)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              const SizedBox(height: 24),

              // Share Section
              Text(
                isMM ? 'Share To:' : 'Share To:',
                style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _ShareButton(icon: '▶️', label: 'YouTube', onTap: onShare),
                  _ShareButton(icon: '🎵', label: 'TikTok', onTap: onShare),
                  _ShareButton(icon: '📘', label: 'Facebook', onTap: onShare),
                  _ShareButton(icon: '📷', label: 'Instagram', onTap: onShare),
                ],
              ),
              const SizedBox(height: 24),

              // Applied Features
              if (appliedFeatures.isNotEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1a1a2e),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF3a3a4a)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isMM ? 'Applied Features:' : 'Applied Features:',
                        style: const TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 8),
                      ...appliedFeatures.map((f) => Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Row(
                          children: [
                            const Text('✅', style: TextStyle(fontSize: 14)),
                            const SizedBox(width: 8),
                            Text(f, style: const TextStyle(color: Colors.white70, fontSize: 13)),
                          ],
                        ),
                      )),
                    ],
                  ),
                ),
              const SizedBox(height: 24),

              // Create Another Button
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: onCreateAnother,
                  icon: const Icon(Icons.add),
                  label: Text(isMM ? '➕ Video အသစ်ဖန်တီးမည်' : '➕ Create Another Video'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: const BorderSide(color: AppColors.primary),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}

class _ShareButton extends StatelessWidget {
  final String icon;
  final String label;
  final VoidCallback? onTap;

  const _ShareButton({required this.icon, required this.label, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 6),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFF2a2a3a),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFF3a3a4a)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(icon, style: const TextStyle(fontSize: 14)),
            const SizedBox(width: 4),
            Text(label, style: const TextStyle(color: Colors.white70, fontSize: 11)),
          ],
        ),
      ),
    );
  }
}
