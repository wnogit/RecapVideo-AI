'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { X, Loader2, Lightbulb } from 'lucide-react';

// Tips to show during processing (rotate every 5 seconds)
const PROCESSING_TIPS = [
  "💡 သင့် Video ကို အကောင်းဆုံး Quality နဲ့ ဖန်တီးနေပါတယ်...",
  "💡 မြန်မာဘာသာနဲ့ ပြောပြပေးနေပါတယ်...",
  "💡 Video ပြီးရင် Download လုပ်နိုင်ပါမယ်...",
  "💡 Premium Quality Video ဖန်တီးနေပါတယ်...",
  "💡 သင့် Video ကို ကောင်းမွန်အောင် ပြင်ဆင်နေပါတယ်...",
  "💡 မကြာခင် ပြီးဆုံးတော့မှာပါ...",
];

interface ProcessingViewProps {
  videoId: string;
  thumbnail?: string;
  title?: string;
  progress: number;
  estimatedTime?: number; // seconds remaining
  onCancel: () => void;
}

export function ProcessingView({
  videoId,
  thumbnail,
  title,
  progress,
  estimatedTime,
  onCancel,
}: ProcessingViewProps) {
  const [tipIndex, setTipIndex] = useState(0);

  // Rotate tips every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % PROCESSING_TIPS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Format estimated time
  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `~${seconds} seconds`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `~${minutes}:${secs.toString().padStart(2, '0')} minutes`;
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="p-6 space-y-6">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={title || 'Video'}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Title */}
        <p className="text-center font-medium line-clamp-2">
          {title || 'Processing video...'}
        </p>

        {/* Processing Animation */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-lg font-medium">Creating your video...</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{progress}%</span>
            {estimatedTime && estimatedTime > 0 && (
              <span>⏱️ {formatTime(estimatedTime)}</span>
            )}
          </div>
        </div>

        {/* Rotating Tip */}
        <div className="p-4 bg-muted/50 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2 text-sm">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            <span className="transition-all duration-300">
              {PROCESSING_TIPS[tipIndex]}
            </span>
          </div>
        </div>

        {/* Cancel Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={onCancel}
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </CardContent>
    </Card>
  );
}

// Completed View Component
interface CompletedViewProps {
  videoUrl: string;
  thumbnailUrl?: string;
  title: string;
  duration: string;
  appliedFeatures: string[];
  onDownload: () => void;
  onDownloadThumbnail?: () => void;
  onCreateAnother: () => void;
}

export function CompletedView({
  videoUrl,
  thumbnailUrl,
  title,
  duration,
  appliedFeatures,
  onDownload,
  onDownloadThumbnail,
  onCreateAnother,
}: CompletedViewProps) {
  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="p-6 space-y-6">
        {/* Success Header */}
        <div className="text-center">
          <span className="text-4xl">🎉</span>
          <h2 className="text-xl font-bold mt-2">Completed!</h2>
        </div>

        {/* Video Player */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            src={videoUrl}
            controls
            className="w-full h-full"
            poster={thumbnailUrl}
          />
        </div>

        {/* Video Info */}
        <div className="text-center">
          <p className="font-medium line-clamp-2">{title}</p>
          <p className="text-sm text-muted-foreground">Duration: {duration}</p>
        </div>

        {/* Download Buttons */}
        <div className="space-y-2">
          <Button className="w-full" onClick={onDownload}>
            ⬇️ Download Video (MP4)
          </Button>
          {onDownloadThumbnail && (
            <Button variant="outline" className="w-full" onClick={onDownloadThumbnail}>
              🖼️ Download Thumbnail
            </Button>
          )}
        </div>

        {/* Share Buttons */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-center">Share to:</p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm">▶️ YouTube</Button>
            <Button variant="outline" size="sm">🎵 TikTok</Button>
            <Button variant="outline" size="sm">📘 Facebook</Button>
            <Button variant="outline" size="sm">📷 Instagram</Button>
          </div>
        </div>

        {/* Applied Features */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium mb-2">Applied Features:</p>
          <ul className="space-y-1">
            {appliedFeatures.map((feature, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="text-green-500">✅</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Thumbnail Preview */}
        {thumbnailUrl && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Thumbnail:</p>
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden max-w-[200px]">
              <Image
                src={thumbnailUrl}
                alt="Thumbnail"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        )}

        {/* Create Another */}
        <Button variant="outline" className="w-full" onClick={onCreateAnother}>
          ➕ Create Another Video
        </Button>
      </CardContent>
    </Card>
  );
}
