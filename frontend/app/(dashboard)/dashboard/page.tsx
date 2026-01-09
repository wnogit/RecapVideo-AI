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
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Create engaging recap videos from YouTube content
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Credit Balance</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.credit_balance || 0}</div>
            <p className="text-xs text-muted-foreground">
              <Link href="/buy" className="text-primary hover:underline">
                Buy more credits
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Link href="/orders" className="hover:text-primary">
                View
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              <Link href="/orders" className="text-primary hover:underline">
                Order history
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processingCount}</div>
            <p className="text-xs text-muted-foreground">Videos in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">Total videos created</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
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
