'use client';

/**
 * Live Preview Canvas
 * Real-time 9:16 preview of video with applied settings
 */
import { useVideoCreationStore } from '@/stores/video-creation-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Eye, Smartphone, FlipHorizontal } from 'lucide-react';
import { extractYoutubeId } from '@/lib/youtube';

export function LivePreviewCanvas() {
  const {
    sourceUrl,
    aspectRatio,
    copyrightOptions,
    subtitleOptions,
    logoOptions,
    outroOptions,
    voiceId,
  } = useVideoCreationStore();

  // Use centralized YouTube ID extraction
  const videoId = extractYoutubeId(sourceUrl);
  const thumbnailUrl = videoId 
    ? `https://i.ytimg.com/vi/${videoId}/oar2.jpg`
    : null;

  // Get dimensions based on aspect ratio
  const getDimensions = () => {
    switch (aspectRatio) {
      case '9:16': return { width: 180, height: 320 };
      case '16:9': return { width: 320, height: 180 };
      case '1:1': return { width: 240, height: 240 };
      case '4:5': return { width: 200, height: 250 };
      default: return { width: 180, height: 320 };
    }
  };

  const dimensions = getDimensions();

  // Logo position mapping
  const getLogoPosition = () => {
    switch (logoOptions.position) {
      case 'top-left': return 'top-2 left-2';
      case 'top-right': return 'top-2 right-2';
      case 'bottom-left': return 'bottom-12 left-2';
      case 'bottom-right': return 'bottom-12 right-2';
      default: return 'top-2 right-2';
    }
  };

  // Subtitle position mapping
  const getSubtitlePosition = () => {
    switch (subtitleOptions.position) {
      case 'top': return 'top-4';
      case 'center': return 'top-1/2 -translate-y-1/2';
      case 'bottom': return 'bottom-4';
      default: return 'bottom-4';
    }
  };

  // Subtitle background style
  const getSubtitleBackground = () => {
    switch (subtitleOptions.background) {
      case 'none': return 'bg-transparent';
      case 'semi': return 'bg-black/50 backdrop-blur-sm';
      case 'solid': return 'bg-black/80';
      default: return 'bg-black/50 backdrop-blur-sm';
    }
  };

  // Subtitle size
  const getSubtitleSize = () => {
    switch (subtitleOptions.size) {
      case 'small': return 'text-[8px]';
      case 'medium': return 'text-[10px]';
      case 'large': return 'text-xs';
      default: return 'text-xs';
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Eye className="h-4 w-4" />
          📺 Live Preview
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex flex-col items-center pb-4">
        {/* Device Frame */}
        <div className="relative">
          {/* Phone Frame */}
          <div className="relative bg-gray-900 rounded-[24px] p-2 shadow-xl">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-900 rounded-b-xl z-10" />
            
            {/* Screen */}
            <div 
              className={cn(
                "relative rounded-[16px] overflow-hidden bg-gradient-to-br from-violet-900 to-pink-900",
                copyrightOptions.horizontalFlip && "scale-x-[-1]"
              )}
              style={{ 
                width: dimensions.width, 
                height: dimensions.height,
                filter: copyrightOptions.colorAdjust 
                  ? 'brightness(1.05) contrast(1.05) saturate(1.1)' 
                  : 'none',
                transform: `${copyrightOptions.horizontalFlip ? 'scaleX(-1)' : ''} ${copyrightOptions.slightZoom ? 'scale(1.05)' : ''}`,
              }}
            >
              {/* Video Thumbnail or Placeholder */}
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt="Video preview"
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white/50">
                    <Smartphone className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-xs font-myanmar">URL ထည့်ပါ</p>
                  </div>
                </div>
              )}

              {/* Copyright Effects Indicator */}
              {copyrightOptions.horizontalFlip && (
                <div 
                  className="absolute top-2 left-2 bg-black/50 text-white text-[8px] px-1.5 py-0.5 rounded flex items-center gap-1"
                  style={{ transform: 'scaleX(-1)' }} // Flip back for readability
                >
                  <FlipHorizontal className="h-2 w-2" />
                  Flipped
                </div>
              )}

              {/* Logo Overlay */}
              {logoOptions.enabled && (
                <div 
                  className={cn(
                    "absolute z-10",
                    getLogoPosition()
                  )}
                  style={{ 
                    opacity: logoOptions.opacity / 100,
                    transform: copyrightOptions.horizontalFlip ? 'scaleX(-1)' : 'none',
                  }}
                >
                  {logoOptions.imageUrl ? (
                    <img
                      src={logoOptions.imageUrl}
                      alt="Logo"
                      className={cn(
                        "rounded",
                        logoOptions.size === 'small' && 'w-6 h-6',
                        logoOptions.size === 'medium' && 'w-8 h-8',
                        logoOptions.size === 'large' && 'w-12 h-12',
                      )}
                    />
                  ) : (
                    <div className={cn(
                      "bg-white/20 backdrop-blur-sm rounded flex items-center justify-center text-white text-[6px]",
                      logoOptions.size === 'small' && 'w-6 h-6',
                      logoOptions.size === 'medium' && 'w-8 h-8',
                      logoOptions.size === 'large' && 'w-12 h-12',
                    )}>
                      LOGO
                    </div>
                  )}
                </div>
              )}

              {/* Subtitle Overlay */}
              {subtitleOptions.enabled && (
                <div 
                  className={cn(
                    "absolute left-2 right-2 z-10 text-center",
                    getSubtitlePosition()
                  )}
                  style={{ transform: copyrightOptions.horizontalFlip ? 'scaleX(-1)' : 'none' }}
                >
                  <div 
                    className={cn(
                      "inline-block px-2 py-1 rounded font-myanmar",
                      getSubtitleBackground(),
                      getSubtitleSize()
                    )}
                    style={{ 
                      color: subtitleOptions.color,
                    }}
                  >
                    မြန်မာဘာသာ စာတန်း နမူနာ
                  </div>
                </div>
              )}

              {/* Voice Indicator */}
              <div 
                className="absolute bottom-2 left-2 bg-black/50 text-white text-[8px] px-1.5 py-0.5 rounded flex items-center gap-1"
                style={{ transform: copyrightOptions.horizontalFlip ? 'scaleX(-1)' : 'none' }}
              >
                🎤 {voiceId.includes('Nilar') ? 'Nilar' : 'Thiha'}
              </div>
            </div>

            {/* Home Indicator */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-16 h-1 bg-gray-600 rounded-full" />
          </div>
        </div>

        {/* Preview Info */}
        <div className="mt-4 text-center text-xs text-muted-foreground space-y-1">
          <p className="font-medium">📐 {aspectRatio} Format</p>
          
          {/* Active Effects */}
          <div className="flex flex-wrap justify-center gap-1 mt-2">
            {copyrightOptions.colorAdjust && (
              <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 rounded text-[10px]">
                🎨 Color
              </span>
            )}
            {copyrightOptions.horizontalFlip && (
              <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 rounded text-[10px]">
                🔄 Flip
              </span>
            )}
            {copyrightOptions.slightZoom && (
              <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 rounded text-[10px]">
                🔍 Zoom
              </span>
            )}
            {copyrightOptions.audioPitchShift && (
              <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 rounded text-[10px]">
                🎵 Pitch
              </span>
            )}
            {subtitleOptions.enabled && (
              <span className="px-1.5 py-0.5 bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 rounded text-[10px]">
                📝 Subtitle
              </span>
            )}
            {logoOptions.enabled && (
              <span className="px-1.5 py-0.5 bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-400 rounded text-[10px]">
                🖼️ Logo
              </span>
            )}
            {outroOptions.enabled && (
              <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 rounded text-[10px]">
                🎬 Outro
              </span>
            )}
          </div>
        </div>

        {/* Outro Preview Note */}
        {outroOptions.enabled && outroOptions.channelName && (
          <div className="mt-3 p-2 bg-muted rounded-lg text-center">
            <p className="text-[10px] text-muted-foreground">Outro Preview:</p>
            <p className="text-xs font-medium mt-1">
              {outroOptions.platform === 'youtube' && '🔔 Subscribe လုပ်ပေးပါ'}
              {outroOptions.platform === 'tiktok' && '🎵 Follow လုပ်ပေးပါ'}
              {outroOptions.platform === 'facebook' && '👍 Page ကို Like လုပ်ပေးပါ'}
              {outroOptions.platform === 'instagram' && '📷 Follow လုပ်ပေးပါ'}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              @{outroOptions.channelName || 'YourChannel'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
