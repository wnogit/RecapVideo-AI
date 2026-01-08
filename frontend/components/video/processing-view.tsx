'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { X, Loader2, Lightbulb, Check, Circle } from 'lucide-react';
import { VideoStatus } from '@/stores/video-store';

// Privacy-focused tips (no technology names)
const PROCESSING_TIPS = [
  "💡 TikTok မှာ upload လုပ်တဲ့အခါ #shorts tag ထည့်ပေးပါ",
  "💡 Facebook Reels မှာလည်း ဒီ Video ကို တင်လို့ရပါတယ်",
  "💡 ကြော်ငြာအတွက် Credits ပိုသက်သာပါတယ်",
  "💡 Instagram Reels မှာလည်း share လုပ်နိုင်ပါတယ်",
  "💡 Video ပြီးရင် 7 ရက်အတွင်း download လုပ်ပါ",
  "💡 မကြာခင် ပြီးဆုံးတော့မှာပါ...",
];

// Privacy-focused processing steps
const PROCESSING_STEPS = [
  { status: 'pending', label: 'စောင့်ဆိုင်းနေသည်', icon: '⏳' },
  { status: 'extracting_transcript', label: 'Video လေ့လာနေသည်', icon: '🎬' },
  { status: 'generating_script', label: 'Script ရေးနေသည်', icon: '✍️' },
  { status: 'generating_audio', label: 'အသံသွင်းနေသည်', icon: '🎙️' },
  { status: 'rendering_video', label: 'ပြင်ဆင်နေသည်', icon: '🎨' },
  { status: 'uploading', label: 'မကြာခင် ပြီးပါပြီ', icon: '☁️' },
];

interface ProcessingViewProps {
  videoId: string;
  thumbnail?: string;
  title?: string;
  progress: number;
  currentStatus?: VideoStatus;
  statusMessage?: string;
  estimatedTime?: number; // seconds remaining
  onCancel: () => void;
}

export function ProcessingView({
  videoId,
  thumbnail,
  title,
  progress,
  currentStatus = 'pending',
  statusMessage,
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

  // Get current step index
  const currentStepIndex = PROCESSING_STEPS.findIndex(s => s.status === currentStatus);

  // Format estimated time
  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `~${seconds} စက္ကန့်`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `~${minutes}:${secs.toString().padStart(2, '0')} မိနစ်`;
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-lg font-semibold">🎬 Video ဖန်တီးနေပါတယ်</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {title || 'သင့် Video ကို ပြင်ဆင်နေပါတယ်...'}
          </p>
        </div>

        {/* Skeleton Video Preview */}
        <div className="relative aspect-[9/16] max-h-64 bg-muted rounded-lg overflow-hidden mx-auto">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={title || 'Video'}
              fill
              className="object-cover opacity-50"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-pink-500/20 animate-pulse" />
          )}
          {/* Overlay with loading animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/50 backdrop-blur-sm rounded-full p-4">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="space-y-2">
          {PROCESSING_STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isPending = index > currentStepIndex;

            return (
              <div
                key={step.status}
                className={`flex items-center gap-3 py-1.5 px-3 rounded-lg transition-all ${
                  isCurrent ? 'bg-primary/10' : ''
                }`}
              >
                {/* Status Icon */}
                <div className={`flex-shrink-0 ${
                  isCompleted ? 'text-green-500' : 
                  isCurrent ? 'text-primary' : 
                  'text-muted-foreground'
                }`}>
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : isCurrent ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </div>
                
                {/* Label */}
                <span className={`text-sm ${
                  isCompleted ? 'text-green-600 dark:text-green-400' :
                  isCurrent ? 'text-foreground font-medium' :
                  'text-muted-foreground'
                }`}>
                  {step.icon} {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{progress}% ပြီးပါပြီ</span>
            {estimatedTime && estimatedTime > 0 && (
              <span>⏱️ {formatTime(estimatedTime)}</span>
            )}
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <p className="text-center text-sm text-muted-foreground">
            {statusMessage}
          </p>
        )}

        {/* Rotating Tip */}
        <div className="p-4 bg-muted/50 rounded-lg text-center">
          <div className="flex items-center justify-center gap-2 text-sm">
            <Lightbulb className="h-4 w-4 text-yellow-500 flex-shrink-0" />
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
          ဖျက်သိမ်းမည်
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
