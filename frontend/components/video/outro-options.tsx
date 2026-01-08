'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, Film, Youtube, Music, Facebook, Instagram } from 'lucide-react';
import { OutroOptions, OutroPlatform } from '@/lib/types/video-options';
import { cn } from '@/lib/utils';

interface OutroOptionsProps {
  value: OutroOptions;
  onChange: (options: OutroOptions) => void;
  hasUploadedLogo: boolean;
}

const PLATFORMS: { value: OutroPlatform; label: string; icon: React.ReactNode }[] = [
  { value: 'youtube', label: 'YouTube', icon: <Youtube className="h-4 w-4" /> },
  { value: 'tiktok', label: 'TikTok', icon: <Music className="h-4 w-4" /> },
  { value: 'facebook', label: 'Facebook', icon: <Facebook className="h-4 w-4" /> },
  { value: 'instagram', label: 'Instagram', icon: <Instagram className="h-4 w-4" /> },
];

const PLATFORM_CTA: Record<OutroPlatform, string> = {
  youtube: 'Subscribe လုပ်ပေးပါ',
  tiktok: 'Follow လုပ်ပေးပါ',
  facebook: 'Page ကို Like လုပ်ပေးပါ',
  instagram: 'Follow လုပ်ပေးပါ',
};

export function OutroOptionsComponent({ value, onChange, hasUploadedLogo }: OutroOptionsProps) {
  const [isOpen, setIsOpen] = useState(value.enabled);

  const handleChange = <K extends keyof OutroOptions>(key: K, val: OutroOptions[K]) => {
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
              <Film className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-medium">🎬 Outro (Video အဆုံး)</p>
                <p className="text-xs text-muted-foreground">
                  {value.enabled ? `${value.duration}s ${value.platform}` : 'Disabled'}
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
            {/* Platform Selection */}
            <div className="space-y-2">
              <Label>Platform</Label>
              <div className="grid grid-cols-2 gap-2">
                {PLATFORMS.map((platform) => (
                  <Button
                    key={platform.value}
                    type="button"
                    variant={value.platform === platform.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleChange('platform', platform.value)}
                    disabled={!value.enabled}
                    className="justify-start gap-2"
                  >
                    {platform.icon}
                    {platform.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Channel Name */}
            <div className="space-y-2">
              <Label>Channel/Page Name</Label>
              <Input
                value={value.channelName}
                onChange={(e) => handleChange('channelName', e.target.value)}
                placeholder="Your channel name..."
                disabled={!value.enabled}
              />
            </div>

            {/* Use Uploaded Logo */}
            {hasUploadedLogo && (
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <Checkbox
                  id="useUploadedLogo"
                  checked={value.useUploadedLogo}
                  onCheckedChange={(checked) => handleChange('useUploadedLogo', checked as boolean)}
                  disabled={!value.enabled}
                />
                <Label htmlFor="useUploadedLogo" className="cursor-pointer">
                  Use uploaded logo in outro
                </Label>
              </div>
            )}

            {/* Duration */}
            <div className="space-y-2">
              <Label>Duration: {value.duration} seconds</Label>
              <div className="flex gap-2">
                {[3, 5, 7].map((sec) => (
                  <Button
                    key={sec}
                    type="button"
                    variant={value.duration === sec ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleChange('duration', sec)}
                    disabled={!value.enabled}
                    className="flex-1"
                  >
                    {sec}s
                  </Button>
                ))}
              </div>
            </div>

            {/* Outro Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="relative aspect-video bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg overflow-hidden flex flex-col items-center justify-center text-white">
                {/* Subscribe Button */}
                <div className={cn(
                  "px-4 py-2 rounded-lg mb-3 flex items-center gap-2 text-sm font-medium",
                  value.platform === 'youtube' && "bg-red-600",
                  value.platform === 'tiktok' && "bg-black border border-white",
                  value.platform === 'facebook' && "bg-blue-600",
                  value.platform === 'instagram' && "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500",
                )}>
                  {PLATFORMS.find(p => p.value === value.platform)?.icon}
                  <span>
                    {value.platform === 'youtube' && 'Subscribe'}
                    {value.platform === 'tiktok' && 'Follow'}
                    {value.platform === 'facebook' && 'Like'}
                    {value.platform === 'instagram' && 'Follow'}
                  </span>
                </div>

                {/* Channel Name */}
                <p className="text-sm font-medium mb-2">
                  {value.channelName || 'Your Channel Name'}
                </p>

                {/* Logo Placeholder */}
                {value.useUploadedLogo && hasUploadedLogo && (
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-2">
                    <span className="text-xs">LOGO</span>
                  </div>
                )}

                {/* CTA Text */}
                <p className="text-xs text-white/80">
                  {PLATFORM_CTA[value.platform]}
                </p>

                {/* Duration Badge */}
                <div className="absolute bottom-2 right-2 text-xs bg-black/50 px-2 py-1 rounded">
                  {value.duration}s
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
