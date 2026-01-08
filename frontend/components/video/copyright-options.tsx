'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, Shield, Eye } from 'lucide-react';
import { CopyrightOptions, DEFAULT_COPYRIGHT_OPTIONS } from '@/lib/types/video-options';
import { useState } from 'react';

interface CopyrightOptionsProps {
  value: CopyrightOptions;
  onChange: (options: CopyrightOptions) => void;
}

const OPTIONS = [
  {
    key: 'colorAdjust' as const,
    label: 'Auto Color Adjust',
    labelMm: 'အရောင် အနည်းငယ် ပြောင်းခြင်း',
    description: 'Adjusts brightness, contrast, saturation slightly',
  },
  {
    key: 'horizontalFlip' as const,
    label: 'Horizontal Flip',
    labelMm: 'ဘယ်ညာ ပြောင်းခြင်း',
    description: 'Mirrors the video horizontally',
  },
  {
    key: 'slightZoom' as const,
    label: 'Slight Zoom (5%)',
    labelMm: 'အနည်းငယ် ချဲ့ခြင်း',
    description: 'Crops edges slightly for a zoomed effect',
  },
  {
    key: 'audioPitchShift' as const,
    label: 'Audio Pitch Shift',
    labelMm: 'အသံ Pitch ပြောင်းခြင်း',
    description: 'Changes audio pitch by ±3%',
  },
];

export function CopyrightOptionsComponent({ value, onChange }: CopyrightOptionsProps) {
  const [isOpen, setIsOpen] = useState(true);

  const handleChange = (key: keyof CopyrightOptions, checked: boolean) => {
    onChange({
      ...value,
      [key]: checked,
    });
  };

  const enabledCount = Object.values(value).filter(Boolean).length;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-lg overflow-hidden">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-between p-4 h-auto"
          >
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-medium">🛡️ Copyright Protection</p>
                <p className="text-xs text-muted-foreground">
                  {enabledCount} options enabled
                </p>
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-4">
            {OPTIONS.map((option) => (
              <div
                key={option.key}
                className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  id={option.key}
                  checked={value[option.key]}
                  onCheckedChange={(checked) => handleChange(option.key, checked as boolean)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <Label htmlFor={option.key} className="cursor-pointer">
                    <span className="font-medium">{option.label}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {option.labelMm}
                    </p>
                  </Label>
                </div>
              </div>
            ))}

            {/* Preview Effect Button - Optional */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview Effect
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
