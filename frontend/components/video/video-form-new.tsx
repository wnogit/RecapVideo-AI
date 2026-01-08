'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateVideo } from '@/hooks/use-videos';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Link2, Film, AlertCircle, Coins } from 'lucide-react';
import { isYoutubeShortsUrl, isRegularYoutubeUrl } from '@/lib/youtube';

// Components
import { VoiceSelector } from './voice-selector';
import { VideoPreview } from './video-preview';
import { CopyrightOptionsComponent } from './copyright-options';
import { SubtitleOptionsComponent } from './subtitle-options';
import { LogoOptionsComponent } from './logo-options';
import { OutroOptionsComponent } from './outro-options';

// Types
import {
  VideoOptions,
  AspectRatio,
  CopyrightOptions,
  SubtitleOptions,
  LogoOptions,
  OutroOptions,
  DEFAULT_COPYRIGHT_OPTIONS,
  DEFAULT_SUBTITLE_OPTIONS,
  DEFAULT_LOGO_OPTIONS,
  DEFAULT_OUTRO_OPTIONS,
} from '@/lib/types/video-options';

const CREDITS_PER_VIDEO = 2;

const videoSchema = z.object({
  url: z.string()
    .url('Please enter a valid URL')
    .refine(
      (url) => isYoutubeShortsUrl(url),
      'Only YouTube Shorts URLs are supported'
    ),
});

type VideoFormData = z.infer<typeof videoSchema>;

interface VideoFormNewProps {
  onSuccess?: () => void;
}

export function VideoFormNew({ onSuccess }: VideoFormNewProps) {
  const { create, isLoading, error, clearError } = useCreateVideo();
  const { user } = useAuthStore();

  // Form state
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<VideoFormData>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      url: '',
    },
  });

  // Video options state
  const [voiceId, setVoiceId] = useState('my-MM-NilarNeural');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [copyrightOptions, setCopyrightOptions] = useState<CopyrightOptions>(DEFAULT_COPYRIGHT_OPTIONS);
  const [subtitleOptions, setSubtitleOptions] = useState<SubtitleOptions>(DEFAULT_SUBTITLE_OPTIONS);
  const [logoOptions, setLogoOptions] = useState<LogoOptions>(DEFAULT_LOGO_OPTIONS);
  const [outroOptions, setOutroOptions] = useState<OutroOptions>(DEFAULT_OUTRO_OPTIONS);

  const watchedUrl = watch('url');
  const isRegularVideo = Boolean(watchedUrl && isRegularYoutubeUrl(watchedUrl) && !isYoutubeShortsUrl(watchedUrl));
  const hasCredits = (user?.credit_balance || 0) >= CREDITS_PER_VIDEO;

  const onSubmit = async (data: VideoFormData) => {
    try {
      clearError();
      
      // Build complete video options matching backend schema
      const options = {
        aspect_ratio: aspectRatio,
        copyright: {
          color_adjust: copyrightOptions.colorAdjust,
          horizontal_flip: copyrightOptions.horizontalFlip,
          slight_zoom: copyrightOptions.slightZoom,
          audio_pitch_shift: copyrightOptions.audioPitchShift,
        },
        subtitles: {
          enabled: subtitleOptions.enabled,
          size: subtitleOptions.size,
          position: subtitleOptions.position,
          background: subtitleOptions.background,
          color: subtitleOptions.color,
          word_highlight: subtitleOptions.wordHighlight,
        },
        logo: {
          enabled: logoOptions.enabled,
          image_path: logoOptions.imageUrl,
          position: logoOptions.position,
          size: logoOptions.size,
          opacity: logoOptions.opacity,
        },
        outro: {
          enabled: outroOptions.enabled,
          platform: outroOptions.platform,
          channel_name: outroOptions.channelName,
          logo_path: outroOptions.useUploadedLogo && logoOptions.imageUrl ? logoOptions.imageUrl : undefined,
          duration: outroOptions.duration,
        },
      };

      await create({
        url: data.url,
        voice: voiceId,
        language: 'my',
        options,
      });
      
      reset();
      onSuccess?.();
    } catch (err) {
      // Error handled by store
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Film className="h-5 w-5" />
          Create New Video
        </CardTitle>
        <CardDescription>
          YouTube Shorts URL ထည့်ပြီး မြန်မာဘာသာ Recap Video ဖန်တီးပါ
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Credit Warning */}
          {!hasCredits && (
            <div className="rounded-md bg-yellow-500/10 p-3 text-sm text-yellow-600">
              You need at least {CREDITS_PER_VIDEO} credits to create a video.{' '}
              <a href="/buy" className="underline font-medium">
                Buy credits
              </a>
            </div>
          )}

          {/* YouTube URL Input */}
          <div className="space-y-2">
            <Label htmlFor="url">🎬 YouTube Shorts URL</Label>
            <div className="relative">
              <Link2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="url"
                type="url"
                placeholder="https://www.youtube.com/shorts/..."
                className="pl-10"
                {...register('url')}
              />
            </div>
            {errors.url && (
              <p className="text-sm text-destructive">{errors.url.message}</p>
            )}
            {isRegularVideo && (
              <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Only YouTube Shorts are supported</p>
                  <p className="text-xs mt-1 opacity-80">
                    Please use a Shorts URL like: youtube.com/shorts/VIDEO_ID
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Video Preview (shows when URL is valid) */}
          <VideoPreview
            url={watchedUrl || ''}
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
          />

          {/* Voice Selector */}
          <VoiceSelector
            value={voiceId}
            onChange={setVoiceId}
          />

          {/* Copyright Protection */}
          <CopyrightOptionsComponent
            value={copyrightOptions}
            onChange={setCopyrightOptions}
          />

          {/* Subtitles */}
          <SubtitleOptionsComponent
            value={subtitleOptions}
            onChange={setSubtitleOptions}
          />

          {/* Logo */}
          <LogoOptionsComponent
            value={logoOptions}
            onChange={setLogoOptions}
          />

          {/* Outro */}
          <OutroOptionsComponent
            value={outroOptions}
            onChange={setOutroOptions}
            hasUploadedLogo={!!logoOptions.imageUrl}
          />

          {/* Credit Info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              <span>Cost per video:</span>
              <span className="font-semibold text-foreground">{CREDITS_PER_VIDEO} Credits</span>
            </div>
            <div>
              <span>Balance: </span>
              <span className="font-semibold text-foreground">{user?.credit_balance || 0} Credits</span>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 text-lg"
            disabled={isLoading || !hasCredits || isRegularVideo}
          >
            {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            🎬 Generate Video
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
