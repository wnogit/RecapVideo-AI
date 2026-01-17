import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';

/// Slide ad item model
class SlideAdItem {
  final String id;
  final String title;
  final String? subtitle;
  final String? imageUrl;
  final Color backgroundColor;
  final Color textColor;
  final List<Color>? gradientColors;
  final IconData? icon;
  final String? actionRoute;
  final String? actionUrl;

  const SlideAdItem({
    required this.id,
    required this.title,
    this.subtitle,
    this.imageUrl,
    this.backgroundColor = const Color(0xFF8B5CF6),
    this.textColor = Colors.white,
    this.gradientColors,
    this.icon,
    this.actionRoute,
    this.actionUrl,
  });
}

/// Hardcoded ads for now - can be replaced with API later
final List<SlideAdItem> defaultSlideAds = [
  const SlideAdItem(
    id: 'promo_credits',
    title: 'Credits ဝယ်ပြီး Video ဖန်တီးပါ! 🎬',
    subtitle: 'အခုပဲ စတင်လိုက်ပါ',
    gradientColors: [Color(0xFF8B5CF6), Color(0xFFEC4899)],
    icon: Icons.diamond,
    actionRoute: '/credits',
  ),
  const SlideAdItem(
    id: 'new_feature',
    title: 'AI Voice အသစ်များ ထွက်ရှိပြီ! 🎤',
    subtitle: 'မြန်မာအသံ မမ နဲ့ မောင်လေး',
    gradientColors: [Color(0xFF10B981), Color(0xFF059669)],
    icon: Icons.record_voice_over,
    actionRoute: '/create',
  ),
  const SlideAdItem(
    id: 'tip',
    title: 'သိပါသလား? 💡',
    subtitle: 'Video URL ထည့်ပြီး 1 မိနစ်အတွင်း Video ရပါမယ်',
    gradientColors: [Color(0xFFF59E0B), Color(0xFFD97706)],
    icon: Icons.lightbulb_outline,
  ),
];

/// Home screen slide ads widget with auto-scroll
class HomeSlideAds extends StatefulWidget {
  final List<SlideAdItem>? ads;
  final double height;
  final Duration autoScrollDuration;

  const HomeSlideAds({
    super.key,
    this.ads,
    this.height = 80, // Compact height
    this.autoScrollDuration = const Duration(seconds: 5),
  });

  @override
  State<HomeSlideAds> createState() => _HomeSlideAdsState();
}

class _HomeSlideAdsState extends State<HomeSlideAds> {
  late PageController _pageController;
  late Timer _autoScrollTimer;
  int _currentPage = 0;

  List<SlideAdItem> get _ads => widget.ads ?? defaultSlideAds;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _startAutoScroll();
  }

  @override
  void dispose() {
    _autoScrollTimer.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _startAutoScroll() {
    _autoScrollTimer = Timer.periodic(widget.autoScrollDuration, (timer) {
      if (_pageController.hasClients) {
        _currentPage = (_currentPage + 1) % _ads.length;
        _pageController.animateToPage(
          _currentPage,
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  void _onAdTap(SlideAdItem ad) {
    if (ad.actionRoute != null) {
      context.push(ad.actionRoute!);
    }
    // TODO: Handle actionUrl with url_launcher if needed
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    
    if (_ads.isEmpty) return const SizedBox.shrink();

    return Column(
      children: [
        SizedBox(
          height: widget.height,
          child: PageView.builder(
            controller: _pageController,
            itemCount: _ads.length,
            onPageChanged: (index) {
              setState(() => _currentPage = index);
            },
            itemBuilder: (context, index) {
              return _buildAdCard(_ads[index], colors);
            },
          ),
        ),
        const SizedBox(height: 8),
        // Page indicators
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            _ads.length,
            (index) => AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              width: _currentPage == index ? 16 : 6,
              height: 6,
              decoration: BoxDecoration(
                color: _currentPage == index
                    ? AppColors.primary
                    : colors.textTertiary.withOpacity(0.3),
                borderRadius: BorderRadius.circular(3),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAdCard(SlideAdItem ad, AppColorsExtension colors) {
    return GestureDetector(
      onTap: () => _onAdTap(ad),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 2),
        decoration: BoxDecoration(
          gradient: ad.gradientColors != null
              ? LinearGradient(
                  colors: ad.gradientColors!,
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                )
              : null,
          color: ad.gradientColors == null ? ad.backgroundColor : null,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: (ad.gradientColors?.first ?? ad.backgroundColor).withOpacity(0.3),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              // Icon
              if (ad.icon != null)
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(ad.icon, color: ad.textColor, size: 24),
                ),
              if (ad.icon != null) const SizedBox(width: 12),
              
              // Text content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      ad.title,
                      style: TextStyle(
                        color: ad.textColor,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (ad.subtitle != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        ad.subtitle!,
                        style: TextStyle(
                          color: ad.textColor.withOpacity(0.85),
                          fontSize: 12,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
              
              // Arrow indicator
              Icon(
                Icons.arrow_forward_ios,
                color: ad.textColor.withOpacity(0.7),
                size: 16,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
