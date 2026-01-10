'use client';

/**
 * Step 2: Styles
 * Copyright Protection, Subtitles, and Logo settings
 */
import { useState, useRef } from 'react';
import { useVideoCreationStore } from '@/stores/video-creation-store';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  Shield,
  Type,
  Image,
  ChevronDown,
  Palette,
  FlipHorizontal,
  ZoomIn,
  Music,
  AlertCircle,
  Upload,
  X,
} from 'lucide-react';

// Position options
const SUBTITLE_POSITIONS = [
  { value: 'top', label: 'အပေါ်', icon: '⬆️' },
  { value: 'center', label: 'အလယ်', icon: '↔️' },
  { value: 'bottom', label: 'အောက်', icon: '⬇️' },
];

const SUBTITLE_SIZES = [
  { value: 'small', label: 'သေး' },
  { value: 'medium', label: 'လတ်' },
  { value: 'large', label: 'ကြီး' },
];

const SUBTITLE_BACKGROUNDS = [
  { value: 'none', label: 'မရှိ', desc: 'စာသာ' },
  { value: 'semi', label: 'အလင်းဖောက်', desc: 'Glass effect' },
  { value: 'solid', label: 'အပြည့်', desc: 'Solid background' },
];

const LOGO_POSITIONS = [
  { value: 'top-left', label: '↖️ ဘယ်ဘက်အပေါ်' },
  { value: 'top-right', label: '↗️ ညာဘက်အပေါ်' },
  { value: 'bottom-left', label: '↙️ ဘယ်ဘက်အောက်' },
  { value: 'bottom-right', label: '↘️ ညာဘက်အောက်' },
];

const LOGO_SIZES = [
  { value: 'small', label: 'သေး' },
  { value: 'medium', label: 'လတ်' },
  { value: 'large', label: 'ကြီး' },
];

export function Step2Styles() {
  const {
    copyrightOptions,
    subtitleOptions,
    logoOptions,
    setCopyrightOptions,
    setSubtitleOptions,
    setLogoOptions,
  } = useVideoCreationStore();

  // Collapsible states
  const [copyrightOpen, setCopyrightOpen] = useState(true);
  const [subtitleOpen, setSubtitleOpen] = useState(true);
  const [logoOpen, setLogoOpen] = useState(false);

  // Logo file input ref
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('ကျေးဇူးပြု၍ ပုံဖိုင်သာ ရွေးချယ်ပါ');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('ဖိုင်အရွယ်အစား 2MB ထက်မကျော်ရပါ');
      return;
    }

    setIsUploadingLogo(true);

    try {
      // Convert to base64 for preview (in real app, upload to server)
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoOptions({ ...logoOptions, imageUrl: base64 });
        setIsUploadingLogo(false);
      };
      reader.onerror = () => {
        alert('ဖိုင်ဖတ်ရာတွင် အမှားဖြစ်ပါသည်');
        setIsUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Logo upload error:', error);
      setIsUploadingLogo(false);
    }
  };

  // Remove logo
  const handleRemoveLogo = () => {
    setLogoOptions({ ...logoOptions, imageUrl: '' });
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          🎨 Video စတိုင်
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Copyright ကာကွယ်ခြင်း၊ စာတန်း နှင့် Logo ရွေးချယ်ပါ
        </p>
      </div>

      {/* Copyright Protection Section */}
      <Collapsible open={copyrightOpen} onOpenChange={setCopyrightOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 lg:p-2.5 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-950 rounded-lg">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-left">
              <p className="font-medium">🛡️ Copyright ကာကွယ်ခြင်း</p>
              <p className="text-xs text-muted-foreground">
                Video ကို ပုံစံပြောင်းလဲ၍ ကာကွယ်ပါ
              </p>
            </div>
          </div>
          <ChevronDown className={cn(
            "h-5 w-5 transition-transform",
            copyrightOpen && "rotate-180"
          )} />
        </CollapsibleTrigger>

        <CollapsibleContent className="pt-4 space-y-4">
          {/* Color Adjust */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">အရောင် ပြောင်းလဲခြင်း</p>
                <p className="text-xs text-muted-foreground">Brightness, Contrast ပြောင်း</p>
              </div>
            </div>
            <Switch
              checked={copyrightOptions.colorAdjust}
              onCheckedChange={(checked) =>
                setCopyrightOptions({ ...copyrightOptions, colorAdjust: checked })
              }
            />
          </div>

          {/* Horizontal Flip */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <FlipHorizontal className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">ဘေးလှန်ခြင်း</p>
                <p className="text-xs text-muted-foreground">Video ကို ဘေးလှန်မည်</p>
              </div>
            </div>
            <Switch
              checked={copyrightOptions.horizontalFlip}
              onCheckedChange={(checked) =>
                setCopyrightOptions({ ...copyrightOptions, horizontalFlip: checked })
              }
            />
          </div>

          {/* Slight Zoom */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <ZoomIn className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">အနည်းငယ် Zoom</p>
                <p className="text-xs text-muted-foreground">5% Zoom ထည့်မည်</p>
              </div>
            </div>
            <Switch
              checked={copyrightOptions.slightZoom}
              onCheckedChange={(checked) =>
                setCopyrightOptions({ ...copyrightOptions, slightZoom: checked })
              }
            />
          </div>

          {/* Audio Pitch Shift */}
          <div className="space-y-2 p-3 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Music className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">အသံ ပြောင်းလဲခြင်း</p>
                  <p className="text-xs text-muted-foreground">Audio pitch ပြောင်း (Copyright bypass)</p>
                </div>
              </div>
              <Switch
                checked={copyrightOptions.audioPitchShift}
                onCheckedChange={(checked) =>
                  setCopyrightOptions({ ...copyrightOptions, audioPitchShift: checked })
                }
              />
            </div>

            {/* Pitch Slider - Show when enabled */}
            {copyrightOptions.audioPitchShift && (
              <div className="pt-2 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Pitch: {copyrightOptions.pitchValue}x</span>
                  <span className="text-muted-foreground">0.5x - 1.5x</span>
                </div>
                <Slider
                  value={[copyrightOptions.pitchValue]}
                  onValueChange={([value]) =>
                    setCopyrightOptions({ ...copyrightOptions, pitchValue: value })
                  }
                  min={0.5}
                  max={1.5}
                  step={0.1}
                  className="py-1"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>နိမ့်</span>
                  <span>ပုံမှန်</span>
                  <span>မြင့်</span>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Subtitle Section */}
      <Collapsible open={subtitleOpen} onOpenChange={setSubtitleOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 lg:p-2.5 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-lg">
              <Type className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-medium">📝 စာတန်း (Subtitles)</p>
              <p className="text-xs text-muted-foreground">
                မြန်မာဘာသာ စာတန်း ထည့်မည်
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={subtitleOptions.enabled}
              onCheckedChange={(checked) =>
                setSubtitleOptions({ ...subtitleOptions, enabled: checked })
              }
              onClick={(e) => e.stopPropagation()}
            />
            <ChevronDown className={cn(
              "h-5 w-5 transition-transform",
              subtitleOpen && "rotate-180"
            )} />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="pt-4 space-y-4">
          {/* Position */}
          <div className="space-y-2">
            <Label className="text-sm">တည်နေရာ</Label>
            <div className="flex gap-2">
              {SUBTITLE_POSITIONS.map((pos) => (
                <button
                  key={pos.value}
                  type="button"
                  onClick={() => setSubtitleOptions({
                    ...subtitleOptions,
                    position: pos.value as any
                  })}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg border text-sm transition-all",
                    subtitleOptions.position === pos.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:border-primary/50"
                  )}
                >
                  {pos.icon} {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="space-y-2">
            <Label className="text-sm">စာလုံး အရွယ်အစား</Label>
            <div className="flex gap-2">
              {SUBTITLE_SIZES.map((size) => (
                <button
                  key={size.value}
                  type="button"
                  onClick={() => setSubtitleOptions({
                    ...subtitleOptions,
                    size: size.value as any
                  })}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg border text-sm transition-all",
                    subtitleOptions.size === size.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:border-primary/50"
                  )}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>

          {/* Background Style */}
          <div className="space-y-2">
            <Label className="text-sm">နောက်ခံ ပုံစံ</Label>
            <div className="flex gap-2">
              {SUBTITLE_BACKGROUNDS.map((bg) => (
                <button
                  key={bg.value}
                  type="button"
                  onClick={() => setSubtitleOptions({
                    ...subtitleOptions,
                    background: bg.value as any
                  })}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg border text-sm transition-all",
                    subtitleOptions.background === bg.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:border-primary/50"
                  )}
                >
                  <span className="block">{bg.label}</span>
                  <span className="block text-xs text-muted-foreground">{bg.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label className="text-sm">စာလုံး အရောင်</Label>
            <div className="flex gap-2">
              {['#FFFFFF', '#FFFF00', '#00FF00', '#00FFFF', '#FF69B4'].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSubtitleOptions({ ...subtitleOptions, color })}
                  className={cn(
                    "w-10 h-10 rounded-lg border-2 transition-all",
                    subtitleOptions.color === color
                      ? "border-primary scale-110"
                      : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Logo Section */}
      <Collapsible open={logoOpen} onOpenChange={setLogoOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 lg:p-2.5 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-950 rounded-lg">
              <Image className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-left">
              <p className="font-medium">🖼️ Logo ထည့်ခြင်း</p>
              <p className="text-xs text-muted-foreground">
                သင့် Logo ကို Video ပေါ်တင်မည်
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={logoOptions.enabled}
              onCheckedChange={(checked) =>
                setLogoOptions({ ...logoOptions, enabled: checked })
              }
              onClick={(e) => e.stopPropagation()}
            />
            <ChevronDown className={cn(
              "h-5 w-5 transition-transform",
              logoOpen && "rotate-180"
            )} />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="pt-4 space-y-4">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label className="text-sm">Logo ပုံ</Label>

            {/* Hidden file input */}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={handleLogoUpload}
            />

            {/* Upload Area or Preview */}
            {logoOptions.imageUrl ? (
              <div className="relative border-2 border-primary/50 rounded-lg p-4 bg-primary/5">
                <div className="flex items-center gap-4">
                  <img
                    src={logoOptions.imageUrl}
                    alt="Logo preview"
                    className="w-16 h-16 object-contain rounded-lg bg-white dark:bg-gray-800 p-1"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-600">Logo တင်ပြီးပါပြီ ✓</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      အခြား logo ပြောင်းလိုပါက Remove နှိပ်ပါ
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveLogo}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => logoInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all",
                  "hover:border-primary hover:bg-primary/5",
                  isUploadingLogo && "opacity-50 pointer-events-none"
                )}
              >
                {isUploadingLogo ? (
                  <>
                    <div className="h-8 w-8 mx-auto mb-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Uploading...</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload logo
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG (Max 2MB)
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Warning if logo enabled but no image */}
            {logoOptions.enabled && !logoOptions.imageUrl && (
              <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Logo ပုံ Upload လုပ်ပါ</p>
                  <p className="text-xs mt-1 opacity-80">
                    Logo ထည့်လိုပါက ပုံ Upload လုပ်ရန် လိုအပ်ပါသည်။ မထည့်လိုပါက Switch ကို ပိတ်ပါ။
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label className="text-sm">တည်နေရာ</Label>
            <div className="grid grid-cols-2 gap-2">
              {LOGO_POSITIONS.map((pos) => (
                <button
                  key={pos.value}
                  type="button"
                  onClick={() => setLogoOptions({
                    ...logoOptions,
                    position: pos.value as any
                  })}
                  className={cn(
                    "py-2 px-3 rounded-lg border text-sm transition-all",
                    logoOptions.position === pos.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:border-primary/50"
                  )}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="space-y-2">
            <Label className="text-sm">Logo အရွယ်အစား</Label>
            <div className="flex gap-2">
              {LOGO_SIZES.map((size) => (
                <button
                  key={size.value}
                  type="button"
                  onClick={() => setLogoOptions({
                    ...logoOptions,
                    size: size.value as any
                  })}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg border text-sm transition-all",
                    logoOptions.size === size.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:border-primary/50"
                  )}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>

          {/* Opacity */}
          <div className="space-y-2">
            <Label className="text-sm">အလင်းဖောက်နှုန်း: {logoOptions.opacity}%</Label>
            <Slider
              value={[logoOptions.opacity]}
              onValueChange={([value]) => setLogoOptions({ ...logoOptions, opacity: value })}
              min={10}
              max={100}
              step={5}
              className="py-2"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
