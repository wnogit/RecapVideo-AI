import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/navigation/main_navigation.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

import 'package:go_router/go_router.dart';
import '../../../../core/api/video_service.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../videos/presentation/widgets/video_card.dart';

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

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      appBar: AppBar(
        // ... (Keep existing AppBar code, omit for brevity in thought but include in replacement)
        backgroundColor: const Color(0xFF0A0A0A),
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
                  children: const [
                    Text('Pro', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white)),
                    SizedBox(width: 2),
                    Text('⚡', style: TextStyle(fontSize: 10)),
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
              color: const Color(0xFF1A1A1A),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFF333333)),
            ),
            child: Row(
              children: [
                const Icon(Icons.diamond, color: Color(0xFF8B5CF6), size: 16),
                const SizedBox(width: 4),
                Text(
                  '${user?.credits ?? 0}',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white),
                ),
              ],
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: AppColors.primary,
        backgroundColor: const Color(0xFF1A1A1A),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Welcome back, ${user?.name.split(' ').first ?? 'User'}! 👋',
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
              ),
              const SizedBox(height: 4),
              Text(
                'Create engaging recap videos from YouTube content',
                style: TextStyle(fontSize: 14, color: Colors.white.withOpacity(0.6)),
              ),
              const SizedBox(height: 24),
              
              // Stats
              GridView.count(
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                childAspectRatio: 1.5,
                children: [
                  _buildStatCard(
                    context,
                    title: 'Credit Balance',
                    value: '${user?.credits ?? 0}',
                    subtitle: 'Buy more credits',
                    icon: Icons.monetization_on_outlined,
                    gradient: const [Color(0xFF8B5CF6), Color(0xFF6366F1)],
                  ),
                  _buildStatCard(
                    context,
                    title: 'My Orders',
                    value: 'View',
                    subtitle: 'Order history',
                    icon: Icons.shopping_cart_outlined,
                    gradient: const [Color(0xFF10B981), Color(0xFF059669)],
                  ),
                  _buildStatCard(
                    context,
                    title: 'Processing',
                    value: _isLoading ? '-' : _recentVideos.where((v) => v.status == 'processing').length.toString(),
                    subtitle: 'Videos in progress',
                    icon: Icons.access_time,
                    gradient: const [Color(0xFFF59E0B), Color(0xFFD97706)],
                  ),
                  _buildStatCard(
                    context,
                    title: 'Completed',
                    value: _isLoading ? '-' : _recentVideos.where((v) => v.status == 'completed').length.toString(),
                    subtitle: 'Total videos created',
                    icon: Icons.check_circle_outline,
                    gradient: const [Color(0xFF22C55E), Color(0xFF16A34A)],
                  ),
                ],
              ),
              const SizedBox(height: 28),
  
              // Recent Videos Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Recent Videos',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Colors.white),
                  ),
                  TextButton(
                    onPressed: () {
                      // Navigate to Videos tab
                       ref.read(navigationIndexProvider.notifier).state = 1;
                    },
                    child: const Text('All', style: TextStyle(fontSize: 14, color: Color(0xFF8B5CF6))),
                  ),
                ],
              ),
              const SizedBox(height: 12),
  
              // Videos List
              if (_isLoading)
                const Center(child: CircularProgressIndicator(color: AppColors.primary))
              else if (_error != null)
                Center(child: Text('Error: $_error', style: const TextStyle(color: Colors.red)))
              else if (_recentVideos.isEmpty)
                _buildEmptyState()
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

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A1A),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF333333)),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: Color(0xFF2D2D2D),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.video_library_outlined, color: Color(0xFF8B5CF6), size: 40),
          ),
          const SizedBox(height: 16),
          const Text('No videos yet', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
          const SizedBox(height: 8),
          Text(
            'Create your first recap video!',
            style: TextStyle(fontSize: 14, color: Colors.white.withOpacity(0.6)),
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
              child: const Text('Create Video', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
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
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A1A),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF333333)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.white.withOpacity(0.6),
                ),
              ),
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: gradient),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: Colors.white, size: 16),
              ),
            ],
          ),
          const Spacer(),
          Text(
            value,
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: TextStyle(
              fontSize: 11,
              color: Colors.white.withOpacity(0.5),
            ),
          ),
        ],
      ),
    );
  }
}
