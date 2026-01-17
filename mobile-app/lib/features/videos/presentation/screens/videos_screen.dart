import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/utils/burmese_numbers.dart';
import '../../../../core/providers/locale_provider.dart';
import '../../../../core/api/video_service.dart';
import 'video_detail_screen.dart';
import '../widgets/video_card.dart';

/// Videos state
class VideosState {
  final List<Video> videos;
  final bool isLoading;
  final String? error;
  final String filter;

  const VideosState({
    this.videos = const [],
    this.isLoading = false,
    this.error,
    this.filter = 'all',
  });

  VideosState copyWith({
    List<Video>? videos,
    bool? isLoading,
    String? error,
    String? filter,
  }) => VideosState(
    videos: videos ?? this.videos,
    isLoading: isLoading ?? this.isLoading,
    error: error,
    filter: filter ?? this.filter,
  );

  List<Video> get filteredVideos {
    if (filter == 'all') return videos;
    return videos.where((v) => v.status == filter).toList();
  }
}

/// Videos Notifier
class VideosNotifier extends StateNotifier<VideosState> {
  final VideoService _videoService;

  VideosNotifier(this._videoService) : super(const VideosState()) {
    loadVideos();
  }

  Future<void> loadVideos() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final videos = await _videoService.getVideos();
      state = state.copyWith(videos: videos, isLoading: false);
    } catch (e) {
      state = state.copyWith(error: e.toString(), isLoading: false);
    }
  }

  void setFilter(String filter) {
    state = state.copyWith(filter: filter);
  }

  Future<void> deleteVideo(String id) async {
    try {
      await _videoService.deleteVideo(id);
      final updated = state.videos.where((v) => v.id != id).toList();
      state = state.copyWith(videos: updated);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  Future<void> refresh() async {
    await loadVideos();
  }
}

/// Provider
final videosNotifierProvider = StateNotifierProvider<VideosNotifier, VideosState>((ref) {
  return VideosNotifier(ref.watch(videoServiceProvider));
});

/// Videos List Screen - Connected to API
class VideosScreen extends ConsumerWidget {
  const VideosScreen({super.key});

  String _formatNumber(int number, Locale locale) {
    if (locale.languageCode == 'my') {
      return number.toBurmese();
    }
    return number.toString();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(videosNotifierProvider);
    final colors = context.colors;
    final strings = ref.watch(stringsProvider);
    final locale = ref.watch(localeProvider);

    return Scaffold(
      backgroundColor: colors.background,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  const Text('🎬', style: TextStyle(fontSize: 24)),
                  const SizedBox(width: 8),
                  Text(
                    strings.myVideos,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: colors.textPrimary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withAlpha(30),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      '${_formatNumber(state.videos.length, locale)} ${strings.videos.toLowerCase()}',
                      style: const TextStyle(color: AppColors.primary, fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),

            // Filter chips
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  _buildFilterChip(context, ref, 'all', strings.all, state.filter, colors),
                  const SizedBox(width: 8),
                  _buildFilterChip(context, ref, 'completed', strings.completed, state.filter, colors),
                  const SizedBox(width: 8),
                  _buildFilterChip(context, ref, 'processing', strings.processing, state.filter, colors),
                  const SizedBox(width: 8),
                  _buildFilterChip(context, ref, 'failed', strings.failed, state.filter, colors),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Content
            Expanded(
              child: state.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : state.error != null
                      ? _buildErrorState(context, ref, state.error!, colors, strings)
                      : state.filteredVideos.isEmpty
                          ? _buildEmptyState(context, colors, strings)
                          : RefreshIndicator(
                              onRefresh: () => ref.read(videosNotifierProvider.notifier).refresh(),
                              child: ListView.builder(
                                padding: const EdgeInsets.symmetric(horizontal: 16),
                                itemCount: state.filteredVideos.length,
                                itemBuilder: (context, index) {
                                  final video = state.filteredVideos[index];
                                  return Padding(
                                    padding: const EdgeInsets.only(bottom: 12),
                                    child: VideoCard(
                                      video: video,
                                      onTap: () => _openDetail(context, video),
                                    ),
                                  );
                                },
                              ),
                            ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(BuildContext context, WidgetRef ref, String value, String label, String current, AppColorsExtension colors) {
    final isSelected = current == value;
    return GestureDetector(
      onTap: () => ref.read(videosNotifierProvider.notifier).setFilter(value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : colors.surface,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: isSelected ? Colors.white : colors.textSecondary,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context, AppColorsExtension colors, AppStrings strings) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.video_library_outlined, size: 64, color: colors.textTertiary),
          const SizedBox(height: 16),
          Text(strings.noVideosYet, style: TextStyle(color: colors.textSecondary, fontSize: 16)),
          const SizedBox(height: 8),
          Text(strings.createFirstVideo, style: TextStyle(color: colors.textTertiary, fontSize: 13)),
        ],
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, WidgetRef ref, String error, AppColorsExtension colors, AppStrings strings) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 48, color: Colors.red),
          const SizedBox(height: 12),
          Text(strings.failedToLoad, style: TextStyle(color: colors.textSecondary)),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () => ref.read(videosNotifierProvider.notifier).refresh(),
            child: Text(strings.retry),
          ),
        ],
      ),
    );
  }

  void _openDetail(BuildContext context, Video video) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => VideoDetailScreen(
          videoId: video.id,
          title: video.title,
          thumbnailUrl: video.sourceThumbnail,
          videoUrl: video.videoUrl,
          status: video.status,
          video: video,
        ),
      ),
    );
  }
}
