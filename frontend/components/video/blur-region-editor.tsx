'use client';

/**
 * Blur Region Editor
 * Simple UI to add/manage blur regions - actual preview is on the main video preview
 */
import { useState } from 'react';
import { useVideoCreationStore } from '@/stores/video-creation-store';
import { BlurRegion } from '@/lib/types/video-options';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Square } from 'lucide-react';

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
    removeBlurRegion,
  } = useVideoCreationStore();

  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  // Add new blur region with preset positions
  const handleAddRegion = (position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'custom') => {
    let x = 35, y = 80, width = 30, height = 10;
    
    switch (position) {
      case 'top-left':
        x = 2; y = 2; width = 25; height = 8;
        break;
      case 'top-right':
        x = 73; y = 2; width = 25; height = 8;
        break;
      case 'bottom-left':
        x = 2; y = 88; width = 30; height = 10;
        break;
      case 'bottom-right':
        x = 68; y = 88; width = 30; height = 10;
        break;
      case 'custom':
        x = 30; y = 45; width = 40; height = 10;
        break;
    }
    
    const newRegion: BlurRegion = {
      id: generateId(),
      x, y, width, height,
    };
    addBlurRegion(newRegion);
    setSelectedRegion(newRegion.id);
  };

  return (
    <div className="space-y-3">
      {/* Add Blur Box Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleAddRegion('bottom-right')}
          className="gap-1 text-xs"
        >
          <Plus className="h-3 w-3" />
          ညာအောက်ထောင့်
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleAddRegion('bottom-left')}
          className="gap-1 text-xs"
        >
          <Plus className="h-3 w-3" />
          ဘယ်အောက်ထောင့်
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleAddRegion('top-right')}
          className="gap-1 text-xs"
        >
          <Plus className="h-3 w-3" />
          ညာအပေါ်ထောင့်
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleAddRegion('custom')}
          className="gap-1 text-xs"
        >
          <Plus className="h-3 w-3" />
          Custom
        </Button>
      </div>

      {/* Region List */}
      {blurOptions.regions.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Blur Regions ({blurOptions.regions.length})
          </Label>
          <div className="space-y-1">
            {blurOptions.regions.map((region, index) => (
              <div
                key={region.id}
                className="flex items-center justify-between p-2 rounded-lg border bg-muted/30"
              >
                <div className="flex items-center gap-2">
                  <Square className="h-4 w-4 text-primary" />
                  <span className="text-sm">Box {index + 1}</span>
                  <span className="text-xs text-muted-foreground">
                    ({Math.round(region.x)}%, {Math.round(region.y)}%)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBlurRegion(region.id)}
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

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
        💡 YouTube watermark, logo ကို ဖုံးဖို့ blur box ထည့်ပါ။ Preview မှာ blur box တွေ မြင်ရပါမယ်။
      </p>
    </div>
  );
}
