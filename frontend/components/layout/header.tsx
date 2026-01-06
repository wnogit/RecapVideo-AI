'use client';

import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bell, Search, Coins } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
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
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
        </Button>

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
    </header>
  );
}
