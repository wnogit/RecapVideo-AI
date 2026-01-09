'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useVideoStore } from '@/stores/video-store';
import { VideoForm } from '@/components/video/video-form';
import { VideoCard } from '@/components/video/video-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, Video, Clock, CheckCircle, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { videos, fetchVideos, cancelVideo } = useVideoStore();

  useEffect(() => {
    fetchVideos(1, 5); // Fetch recent 5 videos
  }, [fetchVideos]);

  const recentVideos = videos.slice(0, 3);
  const processingCount = videos.filter(
    (v) => !['completed', 'failed', 'cancelled'].includes(v.status)
  ).length;
  const completedCount = videos.filter((v) => v.status === 'completed').length;

  return (
    <div className="space-y-5">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
        </h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Create engaging recap videos from YouTube content
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Credit Balance</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold">{user?.credit_balance || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/buy" className="text-primary hover:underline">
                Buy more credits
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">My Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold">
              <Link href="/orders" className="hover:text-primary transition-colors">
                View
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/orders" className="text-primary hover:underline">
                Order history
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Processing</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold">{processingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Videos in progress</p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Total videos created</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Video Form */}
        <div>
          <VideoForm onSuccess={() => fetchVideos(1, 5)} />
        </div>

        {/* Recent Videos */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Videos</h2>
            <Link
              href="/videos"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>

          {recentVideos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Video className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No videos yet. Create your first video!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onCancel={cancelVideo}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
