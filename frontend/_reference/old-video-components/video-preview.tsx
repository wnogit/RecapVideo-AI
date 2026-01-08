'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Play, Clock, AlertCircle, RefreshCw, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AspectRatio, FORMAT_OPTIONS } from '@/lib/types/video-options';
import { extractYoutubeId } from '@/lib/youtube';
import { cn } from '@/lib/utils';

interface VideoPreviewProps {
  url: string;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (ratio: AspectRatio) => void;
}

interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: string;
}

export function VideoPreview({ url, aspectRatio, onAspectRatioChange }: VideoPreviewProps) {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract video ID and fetch thumbnail
  useEffect(() => {
    const videoId = extractYoutubeId(url);
    
    if (!videoId) {
      setVideoInfo(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Use YouTube thumbnail directly
    const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    
    // Simulate fetching video info (in production, call backend API)
    setVideoInfo({
      title: 'Loading title...',
      thumbnail,
      duration: '0:00',
    });
    setLoading(false);
    
    // TODO: Fetch actual video info from backend
    // fetchVideoInfo(videoId).then(info => setVideoInfo(info));
  }, [url]);

  if (!url || !videoInfo) {
    return (
      <div className="space-y-3">
        <label className="text-sm font-medium">📺 Video Preview</label>
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
          <Play className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Paste a YouTube Shorts URL to see preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">📺 Video Preview</label>
      
      <div className="border rounded-lg overflow-hidden bg-muted/30">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-black">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-destructive">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          ) : (
            <>
              <Image
                src={videoInfo.thumbnail}
                alt={videoInfo.title}
                fill
                className="object-cover"
                unoptimized
              />
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                <div className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center">
                  <Play className="h-8 w-8 text-black ml-1" />
                </div>
              </div>
              {/* Duration badge */}
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded text-xs text-white flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {videoInfo.duration}
              </div>
            </>
          )}
        </div>

        {/* Video Title */}
        <div className="p-3">
          <p className="text-sm font-medium line-clamp-2">{videoInfo.title}</p>
        </div>

        {/* Crop Preview */}
        <div className="px-3 pb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Crop for {FORMAT_OPTIONS.find(f => f.value === aspectRatio)?.label}</span>
            <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs">
              <Maximize2 className="h-3 w-3 mr-1" />
              Adjust
            </Button>
          </div>
          
          {/* Aspect Ratio Quick Buttons */}
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reset
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
            >
              ⚡ Auto-fit
            </Button>
          </div>
        </div>
      </div>

      {/* Format Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">📐 Video Format</label>
        <select
          value={aspectRatio}
          onChange={(e) => onAspectRatioChange(e.target.value as AspectRatio)}
          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
        >
          {FORMAT_OPTIONS.map((format) => (
            <option key={format.value} value={format.value}>
              {format.icon} {format.label} ({format.description})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
