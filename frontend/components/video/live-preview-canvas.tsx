'use client';

/**
 * Live Preview Canvas
 * Real-time 9:16 preview of video with applied settings
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { useVideoCreationStore } from '@/stores/video-creation-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Eye, Smartphone, FlipHorizontal, Move, Maximize2 } from 'lucide-react';
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
    blurOptions,
    cropOptions,
    updateBlurRegion,
    setCropOptions,
  } = useVideoCreationStore();

  // Drag state
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [activeRegionId, setActiveRegionId] = useState<string | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const regionStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Use centralized YouTube ID extraction
  const videoId = extractYoutubeId(sourceUrl);
  // Use maxresdefault for better compatibility with different aspect ratios
  // oar2.jpg is optimized for shorts (9:16) but looks stretched on 16:9
  const thumbnailUrl = videoId
    ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
    : null;

  // Get dimensions based on aspect ratio
  const getDimensions = () => {
    switch (aspectRatio) {
      case '9:16': return { width: 180, height: 320 };
      case '16:9': return { width: 320, height: 180 };
      case '1:1': return { width: 240, height: 240 };
      case '4:5': return { width: 200, height: 250 };
      case 'custom': return { width: 280, height: 280 }; // Square preview for custom
      default: return { width: 180, height: 320 };
    }
  };

  const dimensions = getDimensions();

  // Handle blur region drag start (mouse)
  const handleBlurDragStart = (e: React.MouseEvent, regionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const region = blurOptions.regions.find(r => r.id === regionId);
    if (!region) return;

    setActiveRegionId(regionId);
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    regionStartRef.current = { x: region.x, y: region.y, width: region.width, height: region.height };
  };

  // Handle blur region drag start (touch)
  const handleBlurTouchDragStart = (e: React.TouchEvent, regionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const region = blurOptions.regions.find(r => r.id === regionId);
    if (!region) return;

    const touch = e.touches[0];
    setActiveRegionId(regionId);
    setIsDragging(true);
    dragStartRef.current = { x: touch.clientX, y: touch.clientY };
    regionStartRef.current = { x: region.x, y: region.y, width: region.width, height: region.height };
  };

  // Handle blur region resize start (mouse)
  const handleBlurResizeStart = (e: React.MouseEvent, regionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const region = blurOptions.regions.find(r => r.id === regionId);
    if (!region) return;

    setActiveRegionId(regionId);
    setIsResizing(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    regionStartRef.current = { x: region.x, y: region.y, width: region.width, height: region.height };
  };

  // Handle blur region resize start (touch)
  const handleBlurTouchResizeStart = (e: React.TouchEvent, regionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const region = blurOptions.regions.find(r => r.id === regionId);
    if (!region) return;

    const touch = e.touches[0];
    setActiveRegionId(regionId);
    setIsResizing(true);
    dragStartRef.current = { x: touch.clientX, y: touch.clientY };
    regionStartRef.current = { x: region.x, y: region.y, width: region.width, height: region.height };
  };

  // Handle pointer move for drag/resize (works for both mouse and touch)
  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current || !activeRegionId) return;
    const rect = containerRef.current.getBoundingClientRect();

    if (isDragging) {
      // Calculate delta in percentage from drag start
      const deltaX = ((clientX - dragStartRef.current.x) / rect.width) * 100;
      const deltaY = ((clientY - dragStartRef.current.y) / rect.height) * 100;

      // Apply delta to original position (not current)
      const newX = Math.max(0, Math.min(100 - regionStartRef.current.width, regionStartRef.current.x + deltaX));
      const newY = Math.max(0, Math.min(100 - regionStartRef.current.height, regionStartRef.current.y + deltaY));

      updateBlurRegion(activeRegionId, { x: newX, y: newY });
    }

    if (isResizing) {
      // Calculate new size based on pointer position
      const currentX = ((clientX - rect.left) / rect.width) * 100;
      const currentY = ((clientY - rect.top) / rect.height) * 100;

      const newWidth = Math.max(5, Math.min(100 - regionStartRef.current.x, currentX - regionStartRef.current.x));
      const newHeight = Math.max(5, Math.min(100 - regionStartRef.current.y, currentY - regionStartRef.current.y));

      updateBlurRegion(activeRegionId, { width: newWidth, height: newHeight });
    }
  }, [isDragging, isResizing, activeRegionId, updateBlurRegion]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: MouseEvent) => {
    handlePointerMove(e.clientX, e.clientY);
  }, [handlePointerMove]);

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length > 0) {
      e.preventDefault(); // Prevent scrolling while dragging
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [handlePointerMove]);

  // Handle pointer up (mouse up or touch end)
  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setActiveRegionId(null);
  }, []);

  // Add/remove event listeners for both mouse and touch
  useEffect(() => {
    if (isDragging || isResizing) {
      // Mouse events
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handlePointerUp);
      // Touch events
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handlePointerUp);
      window.addEventListener('touchcancel', handlePointerUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handlePointerUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handlePointerUp);
        window.removeEventListener('touchcancel', handlePointerUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleTouchMove, handlePointerUp]);

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
        {/* Clean Preview (no phone frame) */}
        <div className="relative">
          {/* Glow effect behind */}
          <div
            className="absolute -inset-3 bg-gradient-to-r from-violet-600/30 to-pink-600/30 blur-xl rounded-3xl"
            style={{ width: dimensions.width + 24, height: dimensions.height + 24 }}
          />

          {/* Video Preview Wrapper - for blur region positioning */}
          <div
            ref={containerRef}
            className="relative"
            style={{
              width: dimensions.width,
              height: dimensions.height,
            }}
          >
            {/* Video Content - can be flipped */}
            <div
              className={cn(
                "absolute inset-0 overflow-hidden shadow-2xl border-2 border-white/10",
                aspectRatio === '9:16' && "rounded-[20px]",  // Mobile look
                aspectRatio === '16:9' && "rounded-lg",       // Desktop look
                aspectRatio === '1:1' && "rounded-xl",        // Instagram square
                aspectRatio === '4:5' && "rounded-xl",        // Portrait look
              )}
              style={{
                filter: copyrightOptions.colorAdjust
                  ? 'brightness(1.05) contrast(1.05) saturate(1.1)'
                  : 'none',
                transform: `${copyrightOptions.horizontalFlip ? 'scaleX(-1)' : ''} ${copyrightOptions.slightZoom ? 'scale(1.05)' : ''}`,
              }}
            >
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-900 to-pink-900" />

              {/* Video Thumbnail or Placeholder */}
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt="Video preview"
                  className="absolute inset-0 w-full h-full object-cover bg-black"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ transform: copyrightOptions.horizontalFlip ? 'scaleX(-1)' : 'none' }}
                >
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
                  style={{ transform: 'scaleX(-1)' }}
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
            {/* End of Video Content div */}

            {/* Blur Regions Overlay - Outside flipped container for correct drag behavior */}
            {blurOptions.regions.length > 0 && blurOptions.regions.map((region) => (
              <div
                key={region.id}
                className={cn(
                  "absolute border-2 cursor-move select-none z-30",
                  activeRegionId === region.id
                    ? "border-primary bg-primary/30"
                    : "border-white/60 bg-black/40 hover:border-primary/60"
                )}
                style={{
                  left: `${region.x}%`,
                  top: `${region.y}%`,
                  width: `${region.width}%`,
                  height: `${region.height}%`,
                  backdropFilter: `blur(${blurOptions.intensity}px)`,
                }}
                onMouseDown={(e) => handleBlurDragStart(e, region.id)}
                onTouchStart={(e) => handleBlurTouchDragStart(e, region.id)}
              >
                {/* Move handle */}
                <div className="absolute top-0 left-0 p-0.5 bg-black/70 rounded-br">
                  <Move className="h-2 w-2 text-white" />
                </div>

                {/* Resize handle */}
                <div
                  className="absolute bottom-0 right-0 w-3 h-3 bg-primary cursor-se-resize touch-none"
                  onMouseDown={(e) => handleBlurResizeStart(e, region.id)}
                  onTouchStart={(e) => handleBlurTouchResizeStart(e, region.id)}
                >
                  <Maximize2 className="h-2 w-2 text-white m-0.5" />
                </div>

                {/* Label */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-[6px] text-white/70 bg-black/40 px-1 rounded">BLUR</span>
                </div>
              </div>
            ))}

            {/* Custom Crop Box Overlay - Only when custom aspect ratio selected */}
            {aspectRatio === 'custom' && (
              <>
                {/* Dim area outside crop box */}
                <div className="absolute inset-0 z-20 pointer-events-none">
                  {/* Top overlay */}
                  <div
                    className="absolute left-0 right-0 top-0 bg-black/60"
                    style={{ height: `${cropOptions.y}%` }}
                  />
                  {/* Bottom overlay */}
                  <div
                    className="absolute left-0 right-0 bottom-0 bg-black/60"
                    style={{ height: `${100 - cropOptions.y - cropOptions.height}%` }}
                  />
                  {/* Left overlay */}
                  <div
                    className="absolute left-0 bg-black/60"
                    style={{
                      top: `${cropOptions.y}%`,
                      height: `${cropOptions.height}%`,
                      width: `${cropOptions.x}%`
                    }}
                  />
                  {/* Right overlay */}
                  <div
                    className="absolute right-0 bg-black/60"
                    style={{
                      top: `${cropOptions.y}%`,
                      height: `${cropOptions.height}%`,
                      width: `${100 - cropOptions.x - cropOptions.width}%`
                    }}
                  />
                </div>

                {/* Crop box with drag/resize */}
                <div
                  className="absolute border-2 border-primary cursor-move select-none z-40"
                  style={{
                    left: `${cropOptions.x}%`,
                    top: `${cropOptions.y}%`,
                    width: `${cropOptions.width}%`,
                    height: `${cropOptions.height}%`,
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startCropX = cropOptions.x;
                    const startCropY = cropOptions.y;

                    const onMove = (moveE: MouseEvent) => {
                      const deltaX = ((moveE.clientX - startX) / rect.width) * 100;
                      const deltaY = ((moveE.clientY - startY) / rect.height) * 100;
                      const newX = Math.max(0, Math.min(100 - cropOptions.width, startCropX + deltaX));
                      const newY = Math.max(0, Math.min(100 - cropOptions.height, startCropY + deltaY));
                      setCropOptions({ ...cropOptions, x: newX, y: newY });
                    };
                    const onUp = () => {
                      window.removeEventListener('mousemove', onMove);
                      window.removeEventListener('mouseup', onUp);
                    };
                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                  }}
                >
                  {/* Crop label */}
                  <div className="absolute top-1 left-1 bg-primary text-white text-[8px] px-1.5 py-0.5 rounded">
                    ✂️ CROP
                  </div>

                  {/* Corner resize handles */}
                  {/* Bottom-right */}
                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 bg-primary cursor-se-resize z-50"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const rect = containerRef.current?.getBoundingClientRect();
                      if (!rect) return;

                      const onMove = (moveE: MouseEvent) => {
                        const currentX = ((moveE.clientX - rect.left) / rect.width) * 100;
                        const currentY = ((moveE.clientY - rect.top) / rect.height) * 100;
                        const newWidth = Math.max(10, Math.min(100 - cropOptions.x, currentX - cropOptions.x));
                        const newHeight = Math.max(10, Math.min(100 - cropOptions.y, currentY - cropOptions.y));
                        setCropOptions({ ...cropOptions, width: newWidth, height: newHeight });
                      };
                      const onUp = () => {
                        window.removeEventListener('mousemove', onMove);
                        window.removeEventListener('mouseup', onUp);
                      };
                      window.addEventListener('mousemove', onMove);
                      window.addEventListener('mouseup', onUp);
                    }}
                  >
                    <Maximize2 className="h-3 w-3 text-white m-0.5" />
                  </div>
                </div>
              </>
            )}
          </div>
          {/* End of containerRef wrapper */}
        </div>
        {/* End of Clean Preview div */}

        {/* Platform Label */}
        <div className="mt-4 text-center">
          <span className="px-3 py-1.5 bg-muted rounded-full text-xs font-medium">
            {aspectRatio === '9:16' && '📱 TikTok / Shorts'}
            {aspectRatio === '16:9' && '🖥️ YouTube'}
            {aspectRatio === '1:1' && '⬜ Instagram Square'}
            {aspectRatio === '4:5' && '📷 Instagram Portrait'}
            {aspectRatio === 'custom' && '✂️ Custom Crop'}
          </span>
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
            {blurOptions.regions.length > 0 && (
              <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 rounded text-[10px]">
                🔳 Blur ({blurOptions.regions.length})
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
