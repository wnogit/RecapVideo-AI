'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, Type } from 'lucide-react';
import { 
  SubtitleOptions, 
  SubtitlePosition, 
  SubtitleSize, 
  SubtitleBackground 
} from '@/lib/types/video-options';
import { cn } from '@/lib/utils';

interface SubtitleOptionsProps {
  value: SubtitleOptions;
  onChange: (options: SubtitleOptions) => void;
}

const FONTS = [
  { value: 'Pyidaungsu', label: 'Pyidaungsu (Default)' },
  { value: 'Padauk', label: 'Padauk' },
  { value: 'Myanmar3', label: 'Myanmar3' },
];

const SIZES: { value: SubtitleSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

const POSITIONS: { value: SubtitlePosition; label: string }[] = [
  { value: 'top', label: 'Top' },
  { value: 'center', label: 'Center' },
  { value: 'bottom', label: 'Bottom' },
];

const BACKGROUNDS: { value: SubtitleBackground; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'semi', label: 'Semi-transparent' },
  { value: 'solid', label: 'Solid' },
];

const COLORS = [
  { value: '#FFFFFF', label: 'White' },
  { value: '#FFFF00', label: 'Yellow' },
  { value: '#00FF00', label: 'Green' },
  { value: '#00FFFF', label: 'Cyan' },
];

export function SubtitleOptionsComponent({ value, onChange }: SubtitleOptionsProps) {
  const [isOpen, setIsOpen] = useState(value.enabled);

  const handleChange = <K extends keyof SubtitleOptions>(key: K, val: SubtitleOptions[K]) => {
    onChange({
      ...value,
      [key]: val,
    });
  };

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
              <Type className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-medium">📝 Subtitles (စာတန်းထိုး)</p>
                <p className="text-xs text-muted-foreground">
                  {value.enabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={value.enabled}
                onCheckedChange={(checked) => {
                  handleChange('enabled', checked);
                  setIsOpen(checked);
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-4">
            {/* Font */}
            <div className="space-y-2">
              <Label>Font</Label>
              <select
                value={value.font}
                onChange={(e) => handleChange('font', e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                disabled={!value.enabled}
              >
                {FONTS.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Size */}
            <div className="space-y-2">
              <Label>Size</Label>
              <div className="flex gap-2">
                {SIZES.map((size) => (
                  <Button
                    key={size.value}
                    type="button"
                    variant={value.size === size.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleChange('size', size.value)}
                    disabled={!value.enabled}
                    className="flex-1"
                  >
                    {size.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Position */}
            <div className="space-y-2">
              <Label>Position</Label>
              <div className="flex gap-2">
                {POSITIONS.map((pos) => (
                  <Button
                    key={pos.value}
                    type="button"
                    variant={value.position === pos.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleChange('position', pos.value)}
                    disabled={!value.enabled}
                    className="flex-1"
                  >
                    {pos.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Background */}
            <div className="space-y-2">
              <Label>Background</Label>
              <select
                value={value.background}
                onChange={(e) => handleChange('background', e.target.value as SubtitleBackground)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                disabled={!value.enabled}
              >
                {BACKGROUNDS.map((bg) => (
                  <option key={bg.value} value={bg.value}>
                    {bg.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Text Color</Label>
              <div className="flex gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handleChange('color', color.value)}
                    disabled={!value.enabled}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all",
                      value.color === color.value ? 'border-primary scale-110' : 'border-transparent',
                      !value.enabled && 'opacity-50 cursor-not-allowed'
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            {/* Word Highlight */}
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <Checkbox
                id="wordHighlight"
                checked={value.wordHighlight}
                onCheckedChange={(checked) => handleChange('wordHighlight', checked as boolean)}
                disabled={!value.enabled}
              />
              <Label htmlFor="wordHighlight" className="cursor-pointer flex-1">
                <span className="font-medium">Word Highlight (Karaoke style)</span>
                <p className="text-xs text-muted-foreground">
                  Highlights words as they are spoken
                </p>
              </Label>
            </div>

            {/* Preview */}
            <div className="p-4 bg-black rounded-lg">
              <div 
                className={cn(
                  "text-center py-2 px-4 rounded mx-auto max-w-fit",
                  value.background === 'semi' && 'bg-black/50',
                  value.background === 'solid' && 'bg-black',
                )}
                style={{ 
                  color: value.color,
                  fontSize: value.size === 'small' ? '14px' : value.size === 'medium' ? '18px' : '24px',
                  fontFamily: value.font,
                }}
              >
                မြန်မာဘာသာ စာတန်းထိုး
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
