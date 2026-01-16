import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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

  // Bottom navigation items
  final List<_NavItem> _navItems = [
    _NavItem(
      icon: Icons.home_outlined,
      activeIcon: Icons.home,
      label: 'Home',
    ),
    _NavItem(
      icon: Icons.play_circle_outline,
      activeIcon: Icons.play_circle,
      label: 'Videos',
    ),
    _NavItem(
      icon: Icons.add_circle_outline,
      activeIcon: Icons.add_circle,
      label: 'Create',
      isCenter: true,
    ),
    _NavItem(
      icon: Icons.account_balance_wallet_outlined,
      activeIcon: Icons.account_balance_wallet,
      label: 'Credits',
    ),
    _NavItem(
      icon: Icons.person_outline,
      activeIcon: Icons.person,
      label: 'Me',
    ),
  ];

  void _onItemTapped(int index) {
    ref.read(navigationIndexProvider.notifier).state = index;
  }

  @override
  Widget build(BuildContext context) {
    // Watch the navigation index from provider
    final selectedIndex = ref.watch(navigationIndexProvider);
    
    // Hide nav on Create page (index 2)
    final bool showNav = selectedIndex != 2;

    return Scaffold(
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
      bottomNavigationBar: showNav ? Container(
        decoration: const BoxDecoration(
          color: Color(0xFF0A0A0A),
          // No border - removed white line
        ),
        child: SafeArea(
          top: false,
          child: Container(
            height: 60,
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(_navItems.length, (index) {
                final item = _navItems[index];
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
                                  : const Color(0xFF1A1A1A),
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
                                : const Color(0xFF9E9E9E),
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
                                  : const Color(0xFF9E9E9E),
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
                                  : const Color(0xFF9E9E9E),
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
