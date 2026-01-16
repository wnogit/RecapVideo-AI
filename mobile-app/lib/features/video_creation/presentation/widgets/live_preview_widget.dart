import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/video_creation_provider.dart';

/// Live Preview Widget - Compact size to match web view
class LivePreviewWidget extends ConsumerWidget {
  const LivePreviewWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(videoCreationProvider);
    final options = state.options;
    final thumbnailUrl = options.thumbnailUrl;

    // Smaller dimensions to match web mobile view
    final dimensions = _getDimensions(options.aspectRatio);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Preview Label - Left aligned like web
          Row(
            children: [
              const Icon(Icons.visibility, size: 12, color: Colors.white38),
              const SizedBox(width: 4),
              Text(
                'Live Preview',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white38,
                  fontWeight: FontWeight.w500,
                  fontSize: 10,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Preview Container - Smaller and more compact
          Center(
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Subtle glow effect
                Container(
                  width: dimensions.width + 16,
                  height: dimensions.height + 16,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    gradient: LinearGradient(
                      colors: [
                        const Color(0xFF8B5CF6).withAlpha(30),
                        const Color(0xFFEC4899).withAlpha(30),
                      ],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF8B5CF6).withAlpha(40),
                        blurRadius: 20,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                ),

                // Phone Frame - Compact
                Container(
                  width: dimensions.width,
                  height: dimensions.height,
                  decoration: BoxDecoration(
                    color: const Color(0xFF1a1a2e),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: Colors.white.withAlpha(20),
                      width: 1.5,
                    ),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        // Background gradient
                        Container(
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [Color(0xFF2a1a4a), Color(0xFF1a0a2e)],
                            ),
                          ),
                        ),

                        // Thumbnail or Placeholder
                        if (thumbnailUrl != null)
                          Transform(
                            alignment: Alignment.center,
                            transform: Matrix4.identity()
                              ..scale(
                                options.copyrightOptions.horizontalFlip ? -1.0 : 1.0,
                                1.0,
                              )
                              ..scale(options.copyrightOptions.slightZoom ? 1.05 : 1.0),
                            child: ColorFiltered(
                              colorFilter: options.copyrightOptions.colorAdjust
                                  ? const ColorFilter.matrix([
                                      1.05, 0, 0, 0, 0,
                                      0, 1.05, 0, 0, 0,
                                      0, 0, 1.1, 0, 0,
                                      0, 0, 0, 1, 0,
                                    ])
                                  : const ColorFilter.mode(Colors.transparent, BlendMode.dst),
                              child: Image.network(
                                thumbnailUrl,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) => _buildPlaceholder(context),
                              ),
                            ),
                          )
                        else
                          _buildPlaceholder(context),

                        // Subtitle preview
                        if (options.subtitleOptions.enabled)
                          Positioned(
                            left: 6,
                            right: 6,
                            bottom: options.subtitleOptions.position == 'bottom' ? 20 : null,
                            top: options.subtitleOptions.position == 'top' 
                                ? 20 
                                : options.subtitleOptions.position == 'center' 
                                    ? (dimensions.height / 2) - 15 
                                    : null,
                            child: Center(
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                decoration: BoxDecoration(
                                  color: _getSubtitleBackground(options.subtitleOptions.background),
                                  borderRadius: BorderRadius.circular(3),
                                ),
                                child: Text(
                                  'မြန်မာဘာသာ စာတန်း',
                                  style: TextStyle(
                                    fontSize: _getSubtitleSize(options.subtitleOptions.size),
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                          ),

                        // Logo overlay
                        if (options.logoOptions.enabled)
                          Positioned(
                            top: options.logoOptions.position.contains('top') ? 8 : null,
                            bottom: options.logoOptions.position.contains('bottom') ? 20 : null,
                            left: options.logoOptions.position.contains('left') ? 8 : null,
                            right: options.logoOptions.position.contains('right') ? 8 : null,
                            child: Opacity(
                              opacity: options.logoOptions.opacity / 100,
                              child: Container(
                                width: _getLogoSize(options.logoOptions.size),
                                height: _getLogoSize(options.logoOptions.size),
                                decoration: BoxDecoration(
                                  color: Colors.white24,
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(color: Colors.white30, width: 1),
                                ),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(3),
                                  child: options.logoOptions.localFilePath != null
                                      ? Image.file(
                                          File(options.logoOptions.localFilePath!),
                                          fit: BoxFit.cover,
                                          errorBuilder: (_, __, ___) => const Center(
                                            child: Text('L', style: TextStyle(fontSize: 12, color: Colors.white70, fontWeight: FontWeight.bold)),
                                          ),
                                        )
                                      : const Center(
                                          child: Icon(Icons.image, size: 16, color: Colors.white54),
                                        ),
                                ),
                              ),
                            ),
                          ),

                        // Blur regions overlay - Draggable
                        ...options.blurRegions.map((blur) => Positioned(
                          left: (blur.x / 100) * dimensions.width,
                          top: (blur.y / 100) * dimensions.height,
                          child: GestureDetector(
                            onPanUpdate: (details) {
                              // Calculate new position as percentage
                              final newX = blur.x + (details.delta.dx / dimensions.width) * 100;
                              final newY = blur.y + (details.delta.dy / dimensions.height) * 100;
                              // Clamp to bounds
                              final clampedX = newX.clamp(0.0, 100.0 - blur.width);
                              final clampedY = newY.clamp(0.0, 100.0 - blur.height);
                              ref.read(videoCreationProvider.notifier).updateBlurRegion(
                                blur.id, x: clampedX, y: clampedY,
                              );
                            },
                            child: Container(
                              width: (blur.width / 100) * dimensions.width,
                              height: (blur.height / 100) * dimensions.height,
                              decoration: BoxDecoration(
                                color: Colors.black.withAlpha(100),
                                border: Border.all(color: Colors.red, width: 1.5),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Stack(
                                children: [
                                  const Center(
                                    child: Icon(Icons.blur_on, size: 12, color: Colors.red),
                                  ),
                                  // Resize handle at bottom-right
                                  Positioned(
                                    right: 0,
                                    bottom: 0,
                                    child: GestureDetector(
                                      onPanUpdate: (details) {
                                        final newWidth = blur.width + (details.delta.dx / dimensions.width) * 100;
                                        final newHeight = blur.height + (details.delta.dy / dimensions.height) * 100;
                                        ref.read(videoCreationProvider.notifier).updateBlurRegion(
                                          blur.id,
                                          width: newWidth.clamp(5.0, 100.0 - blur.x),
                                          height: newHeight.clamp(3.0, 100.0 - blur.y),
                                        );
                                      },
                                      child: Container(
                                        width: 12,
                                        height: 12,
                                        decoration: BoxDecoration(
                                          color: Colors.red,
                                          borderRadius: BorderRadius.circular(2),
                                        ),
                                        child: const Icon(Icons.open_in_full, size: 8, color: Colors.white),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        )),

                        // Voice indicator - smaller
                        Positioned(
                          bottom: 6,
                          left: 6,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.black54,
                              borderRadius: BorderRadius.circular(3),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Text('🎤', style: TextStyle(fontSize: 6)),
                                const SizedBox(width: 2),
                                Text(
                                  options.voiceId,
                                  style: const TextStyle(fontSize: 7, color: Colors.white),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),

          // Platform label
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
            decoration: BoxDecoration(
              color: const Color(0xFF2a2a3a),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              _getPlatformLabel(options.aspectRatio),
              style: const TextStyle(fontSize: 11, color: Colors.white70),
            ),
          ),
          const SizedBox(height: 8),
          
          // Format + Effect Badges (like web design)
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Format badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFEC4899).withAlpha(30),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFEC4899).withAlpha(60)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('📐', style: TextStyle(fontSize: 10)),
                    const SizedBox(width: 4),
                    Text(
                      '${options.aspectRatio} Format',
                      style: const TextStyle(fontSize: 10, color: Colors.white),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          
          // Effect badges row
          Wrap(
            spacing: 6,
            runSpacing: 6,
            alignment: WrapAlignment.center,
            children: [
              if (options.copyrightOptions.colorAdjust)
                _buildEffectBadge('🎨 Color', Colors.orange),
              if (options.copyrightOptions.horizontalFlip)
                _buildEffectBadge('🔄 Flip', Colors.blue),
              if (options.copyrightOptions.audioPitchShift)
                _buildEffectBadge('🎵 Pitch', Colors.purple),
              if (options.copyrightOptions.slightZoom)
                _buildEffectBadge('🔍 Zoom', Colors.green),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPlaceholder(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.smartphone, size: 24, color: Colors.white.withAlpha(80)),
          const SizedBox(height: 6),
          Text(
            'URL ထည့်ပါ',
            style: TextStyle(fontSize: 9, color: Colors.white.withAlpha(80)),
          ),
        ],
      ),
    );
  }

  // Larger dimensions for better preview visibility
  Size _getDimensions(String aspectRatio) {
    switch (aspectRatio) {
      case '16:9': return const Size(280, 158);
      case '1:1': return const Size(200, 200);
      case '4:5': return const Size(190, 238);
      default: return const Size(180, 320); // 9:16 - larger preview
    }
  }

  String _getPlatformLabel(String aspectRatio) {
    switch (aspectRatio) {
      case '16:9': return '🖥️ YouTube';
      case '1:1': return '⬜ Instagram';
      case '4:5': return '📷 Portrait';
      default: return '📱 TikTok / Shorts';
    }
  }

  Color _getSubtitleBackground(String bg) {
    switch (bg) {
      case 'none': return Colors.transparent;
      case 'solid': return Colors.black87;
      default: return Colors.black54;
    }
  }

  double _getSubtitleSize(String size) {
    switch (size) {
      case 'small': return 6;
      case 'large': return 9;
      default: return 7;
    }
  }

  double _getLogoSize(String size) {
    switch (size) {
      case 'small': return 24;
      case 'large': return 48;
      default: return 32; // medium
    }
  }

  Widget _buildEffectBadge(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withAlpha(30),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withAlpha(60)),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w500),
      ),
    );
  }
}
