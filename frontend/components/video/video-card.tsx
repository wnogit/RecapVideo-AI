'use client';

import { Video, VideoStatus } from '@/stores/video-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Play,
  Download,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface VideoCardProps {
  video: Video;
  onCancel?: (id: string) => void;
  onDownload?: (url: string) => void;
}

const statusConfig: Record<VideoStatus, { label: string; color: 'default' | 'secondary' | 'success' | 'destructive' | 'warning' }> = {
  pending: { label: 'စောင့်ဆိုင်းနေသည်', color: 'secondary' },
  extracting_transcript: { label: 'လေ့လာနေသည်...', color: 'default' },
  generating_script: { label: 'Script ရေးနေသည်...', color: 'default' },
  generating_audio: { label: 'အသံသွင်းနေသည်...', color: 'default' },
  rendering_video: { label: 'ပြင်ဆင်နေသည်...', color: 'default' },
  uploading: { label: 'မကြာခင်ပြီးမည်...', color: 'default' },
  completed: { label: 'ပြီးပါပြီ', color: 'success' },
  failed: { label: 'မအောင်မြင်ပါ', color: 'destructive' },
  cancelled: { label: 'ဖျက်သိမ်းပြီး', color: 'warning' },
};

export function VideoCard({ video, onCancel, onDownload }: VideoCardProps) {
  const status = statusConfig[video.status] || statusConfig.pending;
  const isProcessing = !['completed', 'failed', 'cancelled'].includes(video.status);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row">
        {/* Thumbnail */}
        <div className="relative w-full md:w-48 h-32 bg-muted flex-shrink-0">
          {video.source_thumbnail ? (
            <img
              src={video.source_thumbnail}
              alt={video.source_title || 'Video thumbnail'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          {video.source_duration_seconds && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
              {formatDuration(video.source_duration_seconds)}
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="flex-1 p-4">
          <div className="flex flex-col h-full">
            {/* Title and Status */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">
                  {video.source_title || video.title || 'Untitled Video'}
                </h3>
                <p className="text-sm text-muted-foreground truncate mt-1">
                  {video.source_url}
                </p>
              </div>
              <Badge variant={status.color as any}>
                {isProcessing && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                {status.label}
              </Badge>
            </div>

            {/* Progress */}
            {isProcessing && (
              <div className="mt-3">
                <Progress value={video.progress_percent} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {video.status_message || `${video.progress_percent}% complete`}
                </p>
              </div>
            )}

            {/* Error */}
            {video.status === 'failed' && video.error_message && (
              <p className="text-sm text-destructive mt-2">{video.error_message}</p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
              </div>

              <div className="flex items-center gap-2">
                {video.status === 'completed' && video.video_url && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(video.video_url!, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDownload?.(video.video_url!)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {isProcessing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onCancel?.(video.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
