import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../theme/app_colors.dart';
import '../l10n/app_strings.dart';
import '../../features/home/presentation/screens/home_screen.dart';
import '../../features/video_creation/presentation/screens/create_video_screen.dart';
import '../../features/videos/presentation/screens/videos_screen.dart';
import '../../features/credits/presentation/screens/credits_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';

/// Provider to control navigation index from anywhere
final navigationIndexProvider = StateProvider<int>((ref) => 0);

/// Main navigation wrapper with bottom navigation bar
class MainNavigation extends ConsumerStatefulWidget {
  const MainNavigation({super.key});

  @override
  ConsumerState<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends ConsumerState<MainNavigation> {

  void _onItemTapped(int index) {
    ref.read(navigationIndexProvider.notifier).state = index;
  }

  @override
  Widget build(BuildContext context) {
    // Watch the navigation index from provider
    final selectedIndex = ref.watch(navigationIndexProvider);
    final colors = context.colors;
    final strings = ref.watch(stringsProvider);
    
    // Build nav items with localized labels
    final navItems = [
      _NavItem(icon: Icons.home_outlined, activeIcon: Icons.home, label: strings.home),
      _NavItem(icon: Icons.play_circle_outline, activeIcon: Icons.play_circle, label: strings.videos),
      _NavItem(icon: Icons.add_circle_outline, activeIcon: Icons.add_circle, label: strings.create, isCenter: true),
      _NavItem(icon: Icons.account_balance_wallet_outlined, activeIcon: Icons.account_balance_wallet, label: strings.credits),
      _NavItem(icon: Icons.person_outline, activeIcon: Icons.person, label: strings.profile),
    ];
    
    // Hide nav on Create page (index 2)
    final bool showNav = selectedIndex != 2;

    return Scaffold(
      extendBody: true, // Required for Glass UI - content extends behind nav bar
      body: IndexedStack(
        index: selectedIndex,
        children: const [
          HomeScreen(),
          VideosScreen(),
          CreateVideoScreen(),
          CreditsScreen(),
          ProfileScreen(),
        ],
      ),
      bottomNavigationBar: showNav ? ClipRect(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
          child: Container(
            decoration: BoxDecoration(
              color: colors.isDark 
                  ? Colors.black.withOpacity(0.6)
                  : Colors.white.withOpacity(0.7),
              border: Border(
                top: BorderSide(
                  color: colors.isDark 
                      ? Colors.white.withOpacity(0.1)
                      : Colors.black.withOpacity(0.1),
                  width: 0.5,
                ),
              ),
            ),
            child: SafeArea(
              top: false,
              child: Container(
                height: 60,
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: List.generate(navItems.length, (index) {
                    final item = navItems[index];
                    final isSelected = selectedIndex == index;
                    
                    return GestureDetector(
                      onTap: () => _onItemTapped(index),
                      behavior: HitTestBehavior.opaque,
                      child: SizedBox(
                        width: 60,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            if (item.isCenter)
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: isSelected 
                                      ? const Color(0xFF8B5CF6) 
                                      : colors.surface,
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: const Color(0xFF8B5CF6),
                                    width: 2,
                                  ),
                                ),
                                child: Icon(
                                  isSelected ? item.activeIcon : item.icon,
                                  color: isSelected ? Colors.white : const Color(0xFF8B5CF6),
                                  size: 22,
                                ),
                              )
                            else
                              Icon(
                                isSelected ? item.activeIcon : item.icon,
                                color: isSelected 
                                    ? const Color(0xFF8B5CF6) 
                                    : colors.textSecondary,
                                size: 24,
                              ),
                            if (!item.isCenter) ...[
                              const SizedBox(height: 4),
                              Text(
                                item.label,
                                style: TextStyle(
                                  fontSize: 10,
                                  color: isSelected 
                                      ? const Color(0xFF8B5CF6) 
                                      : colors.textSecondary,
                                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                                ),
                              ),
                            ] else ...[
                              const SizedBox(height: 2),
                              Text(
                                item.label,
                                style: TextStyle(
                                  fontSize: 10,
                                  color: isSelected 
                                      ? const Color(0xFF8B5CF6) 
                                      : colors.textSecondary,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    );
                  }),
                ),
              ),
            ),
          ),
        ),
      ) : null,
    );
  }
}

class _NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isCenter;

  _NavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    this.isCenter = false,
  });
}
