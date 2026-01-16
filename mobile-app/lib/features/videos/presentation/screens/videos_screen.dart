import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
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

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(videosNotifierProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
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
                    'My Videos',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      color: Colors.white,
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
                      '${state.videos.length} videos',
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
                  _buildFilterChip(context, ref, 'all', 'All', state.filter),
                  const SizedBox(width: 8),
                  _buildFilterChip(context, ref, 'completed', 'Completed', state.filter),
                  const SizedBox(width: 8),
                  _buildFilterChip(context, ref, 'processing', 'Processing', state.filter),
                  const SizedBox(width: 8),
                  _buildFilterChip(context, ref, 'failed', 'Failed', state.filter),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Content
            Expanded(
              child: state.isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : state.error != null
                      ? _buildErrorState(context, ref, state.error!)
                      : state.filteredVideos.isEmpty
                          ? _buildEmptyState(context)
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

  Widget _buildFilterChip(BuildContext context, WidgetRef ref, String value, String label, String current) {
    final isSelected = current == value;
    return GestureDetector(
      onTap: () => ref.read(videosNotifierProvider.notifier).setFilter(value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : const Color(0xFF2a2a3a),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: isSelected ? Colors.white : Colors.white70,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.video_library_outlined, size: 64, color: Colors.white.withAlpha(50)),
          const SizedBox(height: 16),
          Text('No videos yet', style: TextStyle(color: Colors.white.withAlpha(100), fontSize: 16)),
          const SizedBox(height: 8),
          Text('Create your first AI video!', style: TextStyle(color: Colors.white.withAlpha(60), fontSize: 13)),
        ],
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, WidgetRef ref, String error) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 48, color: Colors.red),
          const SizedBox(height: 12),
          Text('Failed to load videos', style: TextStyle(color: Colors.white.withAlpha(100))),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () => ref.read(videosNotifierProvider.notifier).refresh(),
            child: const Text('Retry'),
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
        ),
      ),
    );
  }
}
