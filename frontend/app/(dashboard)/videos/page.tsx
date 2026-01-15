'use client';

import { useEffect, useState } from 'react';
import { useVideos } from '@/hooks/use-videos';
import { useVideoStore } from '@/stores/video-store';
import { VideoCard } from '@/components/video/video-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Loader2, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

type StatusFilter = 'all' | 'pending' | 'processing' | 'completed' | 'failed';

export default function VideosPage() {
  const { videos, isLoading, pagination, loadMore, refresh, hasMore } = useVideos();
  const { cancelVideo } = useVideoStore();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredVideos = videos.filter(video => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return video.status === 'pending';
    if (statusFilter === 'processing') return ['extracting_transcript', 'generating_script', 'generating_audio', 'rendering_video', 'uploading'].includes(video.status);
    if (statusFilter === 'completed') return video.status === 'completed';
    if (statusFilter === 'failed') return ['failed', 'cancelled'].includes(video.status);
    return true;
  });

  const statusCounts = {
    all: videos.length,
    pending: videos.filter(v => v.status === 'pending').length,
    processing: videos.filter(v => ['extracting_transcript', 'generating_script', 'generating_audio', 'rendering_video', 'uploading'].includes(v.status)).length,
    completed: videos.filter(v => v.status === 'completed').length,
    failed: videos.filter(v => ['failed', 'cancelled'].includes(v.status)).length,
  };

  return (
    <div className="space-y-6">
      {/* 7-Day Countdown Banner */}
      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 flex items-center gap-3">
        <Clock className="h-5 w-5 text-orange-500 shrink-0" />
        <div>
          <p className="font-medium text-orange-600">ဗီဒီယိုများကို ၇ ရက်အတွင်း ဒေါင်းလုဒ်လုပ်ပါ</p>
          <p className="text-sm text-muted-foreground">Videos are automatically deleted after 7 days. Download them before they expire!</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">My Videos</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            View and manage your generated videos
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/create">
            <Button size="sm">Create New</Button>
          </Link>
        </div>
      </div>

      {/* Status Tabs - Horizontal scroll on mobile */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="inline-flex items-center rounded-lg bg-muted p-1 min-w-max">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${statusFilter === 'all'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            All Videos
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${statusFilter === 'pending'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('processing')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${statusFilter === 'processing'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Processing
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${statusFilter === 'completed'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Completed
          </button>
          <button
            onClick={() => setStatusFilter('failed')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${statusFilter === 'failed'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Failed
          </button>
        </div>
      </div>

      {/* Videos List */}
      {isLoading && videos.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredVideos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <Video className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {statusFilter === 'all' ? 'No videos yet' : `No ${statusFilter} videos`}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {statusFilter === 'all'
                ? "You haven't created any videos yet. Get started by creating your first video!"
                : `No videos with "${statusFilter}" status found.`}
            </p>
            {statusFilter === 'all' && (
              <Link href="/create">
                <Button>Create Your First Video</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredVideos.map((video) => (
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
            Showing {filteredVideos.length} of {pagination.total} videos
          </p>
        </div>
      )}
    </div>
  );
}
