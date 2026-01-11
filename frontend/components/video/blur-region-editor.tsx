'use client';

/**
 * Blur Region Editor
 * Interactive component to draw/edit blur regions on video preview
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { useVideoCreationStore } from '@/stores/video-creation-store';
import { BlurRegion } from '@/lib/types/video-options';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Plus, Trash2, Move, Maximize2 } from 'lucide-react';

interface BlurRegionEditorProps {
  videoThumbnail?: string;
  aspectRatio?: string;
}

// Generate unique ID
const generateId = () => `blur-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function BlurRegionEditor({ videoThumbnail, aspectRatio = '9:16' }: BlurRegionEditorProps) {
  const {
    blurOptions,
    setBlurOptions,
    addBlurRegion,
    updateBlurRegion,
    removeBlurRegion,
  } = useVideoCreationStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [tempRegion, setTempRegion] = useState<BlurRegion | null>(null);

  // Calculate aspect ratio dimensions
  const getAspectRatioDimensions = () => {
    const [w, h] = aspectRatio.split(':').map(Number);
    return { aspectWidth: w, aspectHeight: h };
  };

  // Convert pixel to percentage
  const pixelToPercent = useCallback((px: number, isWidth: boolean) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const base = isWidth ? rect.width : rect.height;
    return (px / base) * 100;
  }, []);

  // Convert percentage to pixel
  const percentToPixel = useCallback((percent: number, isWidth: boolean) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const base = isWidth ? rect.width : rect.height;
    return (percent / 100) * base;
  }, []);

  // Add new blur region
  const handleAddRegion = () => {
    const newRegion: BlurRegion = {
      id: generateId(),
      x: 35,
      y: 80,
      width: 30,
      height: 10,
    };
    addBlurRegion(newRegion);
    setSelectedRegion(newRegion.id);
  };

  // Handle mouse down on container (start drawing)
  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (e.target !== containerRef.current) return;
    
    const rect = containerRef.current!.getBoundingClientRect();
    const x = pixelToPercent(e.clientX - rect.left, true);
    const y = pixelToPercent(e.clientY - rect.top, false);
    
    setIsDrawing(true);
    setDrawStart({ x, y });
    setTempRegion({
      id: generateId(),
      x,
      y,
      width: 0,
      height: 0,
    });
    setSelectedRegion(null);
  };

  // Handle mouse move (drawing or dragging)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    if (isDrawing && tempRegion) {
      const currentX = pixelToPercent(e.clientX - rect.left, true);
      const currentY = pixelToPercent(e.clientY - rect.top, false);
      
      setTempRegion({
        ...tempRegion,
        x: Math.min(drawStart.x, currentX),
        y: Math.min(drawStart.y, currentY),
        width: Math.abs(currentX - drawStart.x),
        height: Math.abs(currentY - drawStart.y),
      });
    }

    if (isDragging && selectedRegion) {
      const region = blurOptions.regions.find(r => r.id === selectedRegion);
      if (!region) return;

      const deltaX = pixelToPercent(e.clientX - dragStart.x, true);
      const deltaY = pixelToPercent(e.clientY - dragStart.y, false);

      const newX = Math.max(0, Math.min(100 - region.width, region.x + deltaX));
      const newY = Math.max(0, Math.min(100 - region.height, region.y + deltaY));

      updateBlurRegion(selectedRegion, { x: newX, y: newY });
      setDragStart({ x: e.clientX, y: e.clientY });
    }

    if (isResizing && selectedRegion) {
      const region = blurOptions.regions.find(r => r.id === selectedRegion);
      if (!region) return;

      const currentX = pixelToPercent(e.clientX - rect.left, true);
      const currentY = pixelToPercent(e.clientY - rect.top, false);

      const newWidth = Math.max(5, Math.min(100 - region.x, currentX - region.x));
      const newHeight = Math.max(5, Math.min(100 - region.y, currentY - region.y));

      updateBlurRegion(selectedRegion, { width: newWidth, height: newHeight });
    }
  }, [isDrawing, isDragging, isResizing, selectedRegion, tempRegion, drawStart, dragStart, blurOptions.regions, pixelToPercent, updateBlurRegion]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (isDrawing && tempRegion && tempRegion.width > 3 && tempRegion.height > 3) {
      addBlurRegion(tempRegion);
      setSelectedRegion(tempRegion.id);
    }
    setIsDrawing(false);
    setIsDragging(false);
    setIsResizing(false);
    setTempRegion(null);
  }, [isDrawing, tempRegion, addBlurRegion]);

  // Add/remove event listeners
  useEffect(() => {
    if (isDrawing || isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDrawing, isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Handle region drag start
  const handleRegionDragStart = (e: React.MouseEvent, regionId: string) => {
    e.stopPropagation();
    setSelectedRegion(regionId);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, regionId: string) => {
    e.stopPropagation();
    setSelectedRegion(regionId);
    setIsResizing(true);
  };

  const { aspectWidth, aspectHeight } = getAspectRatioDimensions();

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRegion}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Blur Box ထည့်မယ်
          </Button>
          {selectedRegion && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                removeBlurRegion(selectedRegion);
                setSelectedRegion(null);
              }}
              className="gap-1"
            >
              <Trash2 className="h-4 w-4" />
              ဖျက်မယ်
            </Button>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {blurOptions.regions.length} blur region{blurOptions.regions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Preview Container */}
      <div
        ref={containerRef}
        className="relative bg-black rounded-lg overflow-hidden cursor-crosshair select-none"
        style={{
          aspectRatio: `${aspectWidth}/${aspectHeight}`,
          maxHeight: '400px',
        }}
        onMouseDown={handleContainerMouseDown}
      >
        {/* Video Thumbnail or Placeholder */}
        {videoThumbnail ? (
          <img
            src={videoThumbnail}
            alt="Video preview"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">📹</div>
              <p className="text-sm">Video Preview</p>
              <p className="text-xs mt-1">Click & drag to draw blur box</p>
            </div>
          </div>
        )}

        {/* Sample watermark areas to help user */}
        <div className="absolute bottom-2 right-2 text-white/30 text-xs pointer-events-none">
          @youtube
        </div>

        {/* Existing Blur Regions */}
        {blurOptions.regions.map((region) => (
          <div
            key={region.id}
            className={cn(
              "absolute border-2 transition-colors cursor-move",
              selectedRegion === region.id
                ? "border-primary bg-primary/30"
                : "border-white/60 bg-white/20 hover:border-primary/60"
            )}
            style={{
              left: `${region.x}%`,
              top: `${region.y}%`,
              width: `${region.width}%`,
              height: `${region.height}%`,
              backdropFilter: `blur(${blurOptions.intensity}px)`,
            }}
            onMouseDown={(e) => handleRegionDragStart(e, region.id)}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedRegion(region.id);
            }}
          >
            {/* Move handle */}
            <div className="absolute top-1 left-1 p-0.5 bg-black/50 rounded">
              <Move className="h-3 w-3 text-white" />
            </div>
            
            {/* Resize handle */}
            <div
              className="absolute bottom-0 right-0 w-4 h-4 bg-primary cursor-se-resize"
              onMouseDown={(e) => handleResizeStart(e, region.id)}
            >
              <Maximize2 className="h-3 w-3 text-white m-0.5" />
            </div>
          </div>
        ))}

        {/* Temporary region while drawing */}
        {tempRegion && tempRegion.width > 0 && tempRegion.height > 0 && (
          <div
            className="absolute border-2 border-dashed border-primary bg-primary/20"
            style={{
              left: `${tempRegion.x}%`,
              top: `${tempRegion.y}%`,
              width: `${tempRegion.width}%`,
              height: `${tempRegion.height}%`,
            }}
          />
        )}
      </div>

      {/* Blur Intensity Slider */}
      {blurOptions.regions.length > 0 && (
        <div className="space-y-2 p-3 rounded-lg border">
          <div className="flex justify-between text-sm">
            <Label>Blur Intensity</Label>
            <span className="text-muted-foreground">{blurOptions.intensity}</span>
          </div>
          <Slider
            value={[blurOptions.intensity]}
            onValueChange={([value]) =>
              setBlurOptions({ ...blurOptions, intensity: value })
            }
            min={5}
            max={30}
            step={1}
            className="py-1"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>အနည်းငယ်</span>
            <span>အလွန်များ</span>
          </div>
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-muted-foreground">
        💡 Tip: YouTube watermark, logo သို့မဟုတ် original subtitle ကို ဖုံးဖို့ blur box ဆွဲပါ။
        Click & drag လုပ်ပြီး box ဆွဲနိုင်ပါတယ်။
      </p>
    </div>
  );
}
