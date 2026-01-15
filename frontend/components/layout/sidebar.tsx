'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Home,
  Video,
  CreditCard,
  ShoppingCart,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Coins,
  PlusCircle,
  Shield,
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Video ဖန်တီးမည်', href: '/create', icon: PlusCircle, highlight: true },
  { name: 'My Videos', href: '/videos', icon: Video },
  { name: 'Credits', href: '/credits', icon: Coins },
  { name: 'Buy Credits', href: '/buy', icon: ShoppingCart },
  { name: 'Profile', href: '/profile', icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Image src="/logo.png" alt="RecapVideo" width={32} height={32} className="rounded" />
          <span className="text-xl font-bold gradient-text">RecapVideo.AI</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const isHighlight = 'highlight' in item && item.highlight;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : isHighlight
                    ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white hover:from-violet-700 hover:to-pink-700 hover:shadow-md hover:-translate-x-0.5'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:translate-x-0.5'
              )}
              onClick={() => setMobileOpen(false)}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}

        {/* Admin Dashboard Link - Only for admins */}
        {user?.is_admin && (
          <Link
            href="/admin"
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors mt-4 border-t pt-4',
              pathname.startsWith('/admin')
                ? 'bg-orange-600 text-white'
                : 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 dark:text-orange-400'
            )}
            onClick={() => setMobileOpen(false)}
          >
            <Shield className="h-5 w-5" />
            Admin Dashboard
          </Link>
        )}
      </nav>

      {/* User section */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3 mb-4">
          <Avatar>
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.credit_balance || 0} credits
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => {
            logout();
            setMobileOpen(false);
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-md bg-background border"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile sidebar */}
      <div
        className={cn(
          'fixed inset-0 z-40 lg:hidden',
          mobileOpen ? 'block' : 'hidden'
        )}
      >
        <div
          className="fixed inset-0 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 w-64 bg-background border-r flex flex-col max-h-[100dvh]">
          {/* Logo - Fixed at top */}
          <div className="flex h-14 items-center px-6 border-b shrink-0">
            <Link href="/dashboard" className="flex items-center space-x-2" onClick={() => setMobileOpen(false)}>
              <Image src="/logo.png" alt="RecapVideo" width={32} height={32} className="rounded" />
              <span className="text-xl font-bold gradient-text">RecapVideo.AI</span>
            </Link>
          </div>

          {/* Navigation - Scrollable */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto min-h-0">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const isHighlight = 'highlight' in item && item.highlight;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : isHighlight
                        ? 'bg-gradient-to-r from-violet-600 to-pink-600 text-white hover:from-violet-700 hover:to-pink-700 hover:shadow-md hover:-translate-x-0.5'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:translate-x-0.5'
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}

            {/* Admin Dashboard Link - Only for admins */}
            {user?.is_admin && (
              <Link
                href="/admin"
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors mt-4 border-t pt-4',
                  pathname.startsWith('/admin')
                    ? 'bg-orange-600 text-white'
                    : 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 dark:text-orange-400'
                )}
                onClick={() => setMobileOpen(false)}
              >
                <Shield className="h-5 w-5" />
                Admin Dashboard
              </Link>
            )}
          </nav>

          {/* User section - Fixed at bottom (Desktop Style) */}
          <div className="border-t p-4 shrink-0">
            <div className="flex items-center gap-3 mb-4">
              <Avatar>
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.credit_balance || 0} credits
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                logout();
                setMobileOpen(false);
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0 border-r bg-background">
        <NavContent />
      </div>
    </>
  );
}
