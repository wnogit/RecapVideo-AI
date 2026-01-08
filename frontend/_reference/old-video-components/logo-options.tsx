'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ChevronDown, ImageIcon, Upload, X } from 'lucide-react';
import { LogoOptions, LogoPosition, LogoSize } from '@/lib/types/video-options';
import { cn } from '@/lib/utils';

interface LogoOptionsProps {
  value: LogoOptions;
  onChange: (options: LogoOptions) => void;
}

const POSITIONS: { value: LogoPosition; label: string; pos: string }[] = [
  { value: 'top-left', label: 'TL', pos: 'top-0 left-0' },
  { value: 'top-right', label: 'TR', pos: 'top-0 right-0' },
  { value: 'bottom-left', label: 'BL', pos: 'bottom-0 left-0' },
  { value: 'bottom-right', label: 'BR', pos: 'bottom-0 right-0' },
];

const SIZES: { value: LogoSize; label: string }[] = [
  { value: 'small', label: 'S' },
  { value: 'medium', label: 'M' },
  { value: 'large', label: 'L' },
];

export function LogoOptionsComponent({ value, onChange }: LogoOptionsProps) {
  const [isOpen, setIsOpen] = useState(value.enabled);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = <K extends keyof LogoOptions>(key: K, val: LogoOptions[K]) => {
    onChange({
      ...value,
      [key]: val,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In production, upload to server and get URL
      // For now, create a local URL
      const url = URL.createObjectURL(file);
      handleChange('imageUrl', url);
    }
  };

  const removeLogo = () => {
    if (value.imageUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(value.imageUrl);
    }
    handleChange('imageUrl', undefined);
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
              <ImageIcon className="h-5 w-5 text-primary" />
              <div className="text-left">
                <p className="font-medium">🏷️ Logo & Branding</p>
                <p className="text-xs text-muted-foreground">
                  {value.enabled ? (value.imageUrl ? 'Logo uploaded' : 'No logo') : 'Disabled'}
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
            {/* Upload Area */}
            <div className="space-y-2">
              <Label>Logo Image</Label>
              
              {value.imageUrl ? (
                <div className="relative w-24 h-24 border rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={value.imageUrl}
                    alt="Logo"
                    fill
                    className="object-contain p-2"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute top-1 right-1 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!value.enabled}
                  className={cn(
                    "w-full p-6 border-2 border-dashed rounded-lg text-center",
                    "hover:border-primary hover:bg-muted/50 transition-colors",
                    !value.enabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Upload Logo</p>
                  <p className="text-xs text-muted-foreground">PNG/SVG with transparent background</p>
                </button>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/svg+xml"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Position Grid */}
            <div className="space-y-2">
              <Label>Position</Label>
              <div className="grid grid-cols-2 gap-2 w-24">
                {POSITIONS.map((pos) => (
                  <Button
                    key={pos.value}
                    type="button"
                    variant={value.position === pos.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleChange('position', pos.value)}
                    disabled={!value.enabled}
                    className="h-10"
                  >
                    {pos.label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Selected: {POSITIONS.find(p => p.value === value.position)?.value.replace('-', ' ')}
              </p>
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

            {/* Opacity */}
            <div className="space-y-2">
              <Label>Opacity: {value.opacity}%</Label>
              <Slider
                value={[value.opacity]}
                onValueChange={([val]) => handleChange('opacity', val)}
                min={10}
                max={100}
                step={5}
                disabled={!value.enabled}
                className="w-full"
              />
            </div>

            {/* Preview */}
            <div className="relative aspect-[9/16] bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg overflow-hidden max-w-[120px]">
              {value.imageUrl && (
                <div 
                  className={cn(
                    "absolute p-1",
                    POSITIONS.find(p => p.value === value.position)?.pos
                  )}
                  style={{ opacity: value.opacity / 100 }}
                >
                  <div className={cn(
                    "bg-white/10 rounded",
                    value.size === 'small' && 'w-6 h-6',
                    value.size === 'medium' && 'w-8 h-8',
                    value.size === 'large' && 'w-10 h-10',
                  )}>
                    <Image
                      src={value.imageUrl}
                      alt="Logo preview"
                      fill
                      className="object-contain p-1"
                      unoptimized
                    />
                  </div>
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center text-white/30 text-xs">
                Preview
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
