import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/navigation/main_navigation.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

import 'package:go_router/go_router.dart';
import '../../../../core/api/video_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/utils/burmese_numbers.dart';
import '../../../videos/presentation/widgets/video_card.dart';
import '../widgets/home_slide_ads.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  List<Video> _recentVideos = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final videos = await ref.read(videoServiceProvider).getVideos();
      if (mounted) {
        setState(() {
          // Sort by createdAt desc and take first 5
          videos.sort((a, b) => b.createdAt.compareTo(a.createdAt));
          _recentVideos = videos.take(5).toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  /// Format number based on current locale
  String _formatNumber(dynamic number) {
    final strings = ref.read(stringsProvider);
    if (strings.isEnglish) {
      return number.toString();
    } else {
      return BurmeseNumbers.convert(number);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final colors = context.colors;
    final strings = ref.watch(stringsProvider);
    
    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        // ... (Keep existing AppBar code, omit for brevity in thought but include in replacement)
        backgroundColor: colors.background,
        elevation: 0,
        title: Row(
          children: [
            Image.asset(
              'assets/images/logo_small.png',
              width: 32,
              height: 32,
              errorBuilder: (context, error, stackTrace) => Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF8B5CF6), Color(0xFFEC4899)],
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.play_arrow, color: Colors.white, size: 20),
              ),
            ),
            const SizedBox(width: 8),
            if (user?.credits != null && user!.credits > 0)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF8B5CF6), Color(0xFFEC4899)],
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(strings.pro, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white)),
                    const SizedBox(width: 2),
                    const Text('⚡', style: TextStyle(fontSize: 10)),
                  ],
                ),
              ),
          ],
        ),
        centerTitle: false,
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: colors.border),
            ),
            child: Row(
              children: [
                const Icon(Icons.diamond, color: Color(0xFF8B5CF6), size: 16),
                const SizedBox(width: 4),
                Text(
                  _formatNumber(user?.credits ?? 0),
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: colors.textPrimary),
                ),
              ],
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: AppColors.primary,
        backgroundColor: colors.surface,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${strings.welcomeBack}, ${user?.name.split(' ').first ?? 'User'}! 👋',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: colors.textPrimary),
              ),
              const SizedBox(height: 4),
              Text(
                strings.appTagline,
                style: TextStyle(fontSize: 14, color: colors.textSecondary),
              ),
              const SizedBox(height: 16),
              
              // Stats
              GridView.count(
                crossAxisCount: 2,
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                childAspectRatio: 1.6,
                children: [
                  _buildStatCard(
                    context,
                    title: strings.creditBalance,
                    value: _formatNumber(user?.credits ?? 0),
                    subtitle: strings.buyCredits,
                    icon: Icons.monetization_on_outlined,
                    gradient: const [Color(0xFF8B5CF6), Color(0xFF6366F1)],
                    colors: colors,
                  ),
                  _buildStatCard(
                    context,
                    title: strings.myOrders,
                    value: strings.viewAll,
                    subtitle: strings.orderHistory,
                    icon: Icons.shopping_cart_outlined,
                    gradient: const [Color(0xFF10B981), Color(0xFF059669)],
                    colors: colors,
                  ),
                  _buildStatCard(
                    context,
                    title: strings.processing,
                    value: _isLoading ? '-' : _formatNumber(_recentVideos.where((v) => v.status == 'processing').length),
                    subtitle: strings.processingVideo,
                    icon: Icons.access_time,
                    gradient: const [Color(0xFFF59E0B), Color(0xFFD97706)],
                    colors: colors,
                  ),
                  _buildStatCard(
                    context,
                    title: strings.completed,
                    value: _isLoading ? '-' : _formatNumber(_recentVideos.where((v) => v.status == 'completed').length),
                    subtitle: strings.videoReady,
                    icon: Icons.check_circle_outline,
                    gradient: const [Color(0xFF22C55E), Color(0xFF16A34A)],
                    colors: colors,
                  ),
                ],
              ),
              // Slide Ads Banner - pulled up
              Transform.translate(
                offset: const Offset(0, -35),
                child: const HomeSlideAds(),
              ),
  
              // Recent Videos Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    strings.recentVideos,
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: colors.textPrimary),
                  ),
                  TextButton(
                    onPressed: () {
                      // Navigate to Videos tab
                      ref.read(navigationIndexProvider.notifier).state = 1;
                    },
                    child: Text(strings.all, style: const TextStyle(fontSize: 14, color: Color(0xFF8B5CF6))),
                  ),
                ],
              ),
              const SizedBox(height: 8),
  
              // Videos List
              if (_isLoading)
                const Center(child: CircularProgressIndicator(color: AppColors.primary))
              else if (_error != null)
                Center(child: Text('${strings.error}: $_error', style: const TextStyle(color: Colors.red)))
              else if (_recentVideos.isEmpty)
                _buildEmptyState(colors, strings)
              else
                ListView.separated(
                  physics: const NeverScrollableScrollPhysics(),
                  shrinkWrap: true,
                  itemCount: _recentVideos.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final video = _recentVideos[index];
                    return VideoCard(
                      video: video, 
                      onTap: () {
                        context.push('/video/${video.id}', extra: video);
                      },
                    );
                  },
                ),
                
              const SizedBox(height: 80), // Bottom padding
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(AppColorsExtension colors, AppStrings strings) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: colors.surfaceVariant,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.video_library_outlined, color: Color(0xFF8B5CF6), size: 40),
          ),
          const SizedBox(height: 16),
          Text(strings.noVideosYet, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: colors.textPrimary)),
          const SizedBox(height: 8),
          Text(
            strings.createFirstVideo,
            style: TextStyle(fontSize: 14, color: colors.textSecondary),
          ),
          const SizedBox(height: 20),
          Container(
            width: double.infinity,
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF8B5CF6), Color(0xFFEC4899)]),
              borderRadius: BorderRadius.circular(12),
            ),
            child: ElevatedButton(
              onPressed: () {
                 ref.read(navigationIndexProvider.notifier).state = 2; // Go to Create
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                shadowColor: Colors.transparent,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(strings.createVideo, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(
    BuildContext context, {
    required String title,
    required String value,
    required String subtitle,
    required IconData icon,
    required List<Color> gradient,
    required AppColorsExtension colors,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 11,
                    color: colors.textSecondary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 4),
              Container(
                padding: const EdgeInsets.all(5),
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: gradient),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: Colors.white, size: 14),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: colors.textPrimary,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: TextStyle(
              fontSize: 10,
              color: colors.textTertiary,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
