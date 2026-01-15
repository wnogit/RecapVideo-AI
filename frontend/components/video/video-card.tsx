'use client';

import { useState } from 'react';
import { Video, VideoStatus } from '@/stores/video-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Play,
  Download,
  Trash2,
  Clock,
  Loader2,
  ExternalLink,
  Info,
  Copy,
  Share2,
  Calendar,
  Timer,
  Film,
  Settings2,
  CheckCircle,
} from 'lucide-react';
import { formatDistanceToNow, differenceInDays, format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

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

// Calculate days left until video expires (7 days from creation)
function getDaysLeft(createdAt: string): number {
  const created = new Date(createdAt);
  const expiresAt = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000);
  return Math.max(0, differenceInDays(expiresAt, new Date()));
}

function getDaysLeftBadge(daysLeft: number) {
  if (daysLeft <= 1) {
    return { label: `${daysLeft} ရက်ကျန်`, color: 'bg-red-500/20 text-red-500 border-red-500/30' };
  } else if (daysLeft <= 3) {
    return { label: `${daysLeft} ရက်ကျန်`, color: 'bg-orange-500/20 text-orange-500 border-orange-500/30' };
  } else {
    return { label: `${daysLeft} ရက်ကျန်`, color: 'bg-green-500/20 text-green-500 border-green-500/30' };
  }
}

export function VideoCard({ video, onCancel, onDownload }: VideoCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const status = statusConfig[video.status] || statusConfig.pending;
  const isProcessing = !['completed', 'failed', 'cancelled'].includes(video.status);
  const isCompleted = video.status === 'completed';
  const daysLeft = getDaysLeft(video.created_at);
  const daysLeftBadge = getDaysLeftBadge(daysLeft);

  const handleCopyUrl = () => {
    if (video.video_url) {
      navigator.clipboard.writeText(video.video_url);
      toast({ title: 'Copied!', description: 'Video URL copied to clipboard' });
    }
  };

  const handleShare = async () => {
    if (video.video_url && navigator.share) {
      try {
        await navigator.share({
          title: video.source_title || 'RecapVideo',
          url: video.video_url,
        });
      } catch (err) {
        handleCopyUrl();
      }
    } else {
      handleCopyUrl();
    }
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row">
          {/* Thumbnail - Compact */}
          <div className="relative w-full sm:w-36 h-24 sm:h-20 bg-muted flex-shrink-0">
            {video.source_thumbnail ? (
              <img
                src={video.source_thumbnail}
                alt={video.source_title || 'Video thumbnail'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            {/* Play overlay for completed videos */}
            {isCompleted && video.video_url && (
              <button
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                onClick={() => window.open(video.video_url!, '_blank')}
              >
                <div className="bg-white/90 rounded-full p-2">
                  <Play className="h-4 w-4 text-black" />
                </div>
              </button>
            )}
            {video.source_duration_seconds && (
              <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded text-[10px]">
                {formatDuration(video.source_duration_seconds)}
              </div>
            )}
          </div>

          {/* Content - Compact */}
          <CardContent className="flex-1 p-3">
            <div className="flex flex-col h-full gap-2">
              {/* Row 1: Title + Status + Days Left */}
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">
                    {video.source_title || video.title || 'Untitled Video'}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(video.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant={status.color as any} className="text-xs h-5">
                    {isProcessing && <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin" />}
                    {status.label}
                  </Badge>
                  {isCompleted && (
                    <Badge variant="outline" className={`text-xs h-5 ${daysLeftBadge.color}`}>
                      {daysLeftBadge.label}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Progress for processing */}
              {isProcessing && (
                <div>
                  <Progress value={video.progress_percent} className="h-1.5" />
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {video.status_message || `${video.progress_percent}%`}
                  </p>
                </div>
              )}

              {/* Error message */}
              {video.status === 'failed' && video.error_message && (
                <p className="text-xs text-destructive truncate">{video.error_message}</p>
              )}

              {/* Row 2: Actions */}
              <div className="flex items-center justify-between mt-auto">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
                </div>

                <div className="flex items-center gap-1">
                  {isCompleted && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setIsDetailsOpen(true)}
                      >
                        <Info className="h-3.5 w-3.5 mr-1" />
                        Details
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => onDownload?.(video.video_url!)}
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Download
                      </Button>
                    </>
                  )}
                  {isProcessing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                      onClick={() => onCancel?.(video.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Film className="h-5 w-5" />
              Video Details
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Video Player */}
            {video.video_url && (
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <video
                  src={video.video_url}
                  controls
                  className="w-full h-full"
                  poster={video.source_thumbnail}
                />
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div>
                  <p className="text-muted-foreground text-xs">Title</p>
                  <p className="font-medium">{video.source_title || video.title || 'Untitled'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Created</p>
                  <p className="font-medium">{format(new Date(video.created_at), 'MMM d, yyyy HH:mm')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Duration</p>
                  <p className="font-medium">{video.source_duration_seconds ? formatDuration(video.source_duration_seconds) : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Expires In</p>
                  <p className={`font-medium ${daysLeft <= 1 ? 'text-red-500' : daysLeft <= 3 ? 'text-orange-500' : 'text-green-500'}`}>
                    {daysLeft} days
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-muted-foreground text-xs">Status</p>
                  <Badge variant={status.color as any}>{status.label}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Source URL</p>
                  <p className="font-medium text-xs truncate">{video.source_url}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Credits Used</p>
                  <p className="font-medium">{video.credits_used || 2} credits</p>
                </div>
              </div>
            </div>

            {/* Settings Used */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Settings Used</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-muted/50 rounded-md p-2">
                  <p className="text-muted-foreground">Aspect Ratio</p>
                  <p className="font-medium">{(video as any).options?.aspect_ratio || '9:16'}</p>
                </div>
                <div className="bg-muted/50 rounded-md p-2">
                  <p className="text-muted-foreground">Voice</p>
                  <p className="font-medium">{video.voice_type?.includes('Nilar') ? 'Nilar' : video.voice_type?.includes('Thiha') ? 'Thiha' : 'Default'}</p>
                </div>
                <div className="bg-muted/50 rounded-md p-2">
                  <p className="text-muted-foreground">Subtitles</p>
                  <p className="font-medium">{(video as any).options?.subtitles?.enabled !== false ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button variant="outline" className="flex-1" onClick={handleCopyUrl}>
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button className="flex-1" onClick={() => onDownload?.(video.video_url!)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
