'use client';

import { useEffect } from 'react';
import { useVideos } from '@/hooks/use-videos';
import { useVideoStore } from '@/stores/video-store';
import { VideoCard } from '@/components/video/video-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Video, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function VideosPage() {
  const { videos, isLoading, pagination, loadMore, refresh, hasMore } = useVideos();
  const { cancelVideo } = useVideoStore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Videos</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your generated videos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/">
            <Button>Create New Video</Button>
          </Link>
        </div>
      </div>

      {/* Videos List */}
      {isLoading && videos.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : videos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <Video className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No videos yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              You haven&apos;t created any videos yet. Get started by creating your first video!
            </p>
            <Link href="/">
              <Button>Create Your First Video</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onCancel={cancelVideo}
              onDownload={(url) => {
                // Trigger download
                const link = document.createElement('a');
                link.href = url;
                link.download = `${video.title || 'video'}.mp4`;
                link.click();
              }}
            />
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={loadMore} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Load More
              </Button>
            </div>
          )}

          {/* Pagination Info */}
          <p className="text-center text-sm text-muted-foreground">
            Showing {videos.length} of {pagination.total} videos
          </p>
        </div>
      )}
    </div>
  );
}
