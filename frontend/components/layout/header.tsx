'use client';

import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bell, Coins, Video, CheckCircle, XCircle, AlertCircle, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Notification {
  id: string;
  type: 'video_completed' | 'video_failed' | 'order_approved' | 'order_rejected' | 'order_failed';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link: string;
}

export function Header() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchNotifications(token);
      // Refresh notifications every 30 seconds
      const interval = setInterval(() => fetchNotifications(token), 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async (token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'video_completed':
        return <Video className="h-4 w-4 text-green-500" />;
      case 'video_failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'order_approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'order_rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'order_failed':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <header className="sticky top-0 z-30 border-b bg-background">
      <div className="max-w-[1600px] mx-auto flex h-16 items-center gap-4 px-4 md:px-8">
      {/* Spacer for mobile menu button */}
      <div className="lg:hidden w-10" />

      {/* Search (optional) */}
      <div className="flex-1">
        {/* Can add search bar here if needed */}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Credits */}
        <Link href="/buy">
          <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
            <Coins className="mr-1 h-3 w-3" />
            {user?.credit_balance || 0} Credits
          </Badge>
        </Link>

        {/* Notifications */}
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="h-[300px]">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem key={notification.id} asChild>
                    <Link
                      href={notification.link}
                      className="flex items-start gap-3 p-3 cursor-pointer"
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(notification.timestamp)}
                        </p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))
              )}
            </ScrollArea>
            {notifications.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Link href="/videos" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full">
                      View all activity
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Avatar */}
        <Link href="/profile">
          <Avatar className="cursor-pointer hover:ring-2 hover:ring-primary transition-all">
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
      </div>
    </header>
  );
}
