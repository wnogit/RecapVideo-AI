'use client';

/**
 * Step 3: Branding
 * Outro settings and final confirmation
 */
import { useState } from 'react';
import { useVideoCreationStore } from '@/stores/video-creation-store';
import { useAuthStore } from '@/stores/auth-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { 
  Clapperboard, 
  ChevronDown, 
  Coins, 
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

// Platform options
const PLATFORMS = [
  { value: 'youtube', label: 'YouTube', icon: '📺', color: 'text-red-500' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵', color: 'text-black dark:text-white' },
  { value: 'facebook', label: 'Facebook', icon: '📘', color: 'text-blue-600' },
  { value: 'instagram', label: 'Instagram', icon: '📷', color: 'text-pink-600' },
];

interface Step3BrandingProps {
  hasCredits: boolean;
  creditsRequired: number;
}

export function Step3Branding({ hasCredits, creditsRequired }: Step3BrandingProps) {
  const { user } = useAuthStore();
  const {
    outroOptions,
    logoOptions,
    copyrightOptions,
    subtitleOptions,
    sourceUrl,
    voiceId,
    aspectRatio,
    setOutroOptions,
  } = useVideoCreationStore();

  const [outroOpen, setOutroOpen] = useState(true);

  // Summary of selected options
  const selectedFeatures = [
    copyrightOptions.colorAdjust && 'အရောင်ပြောင်း',
    copyrightOptions.horizontalFlip && 'ဘေးလှန်',
    copyrightOptions.slightZoom && 'Zoom',
    copyrightOptions.audioPitchShift && 'အသံပြောင်း',
    subtitleOptions.enabled && 'စာတန်း',
    logoOptions.enabled && 'Logo',
    outroOptions.enabled && 'Outro',
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          ✨ အမှတ်တံဆိပ် နှင့် အတည်ပြုခြင်း
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Outro ထည့်ပြီး Video ဖန်တီးမည်
        </p>
      </div>

      {/* Outro Section */}
      <Collapsible open={outroOpen} onOpenChange={setOutroOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-950 rounded-lg">
              <Clapperboard className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-left">
              <p className="font-medium">🎬 Outro (အဆုံးပိုင်း)</p>
              <p className="text-xs text-muted-foreground">
                Subscribe/Follow ခေါ်ဆိုမှု ထည့်မည်
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={outroOptions.enabled}
              onCheckedChange={(checked) => 
                setOutroOptions({ ...outroOptions, enabled: checked })
              }
              onClick={(e) => e.stopPropagation()}
            />
            <ChevronDown className={cn(
              "h-5 w-5 transition-transform",
              outroOpen && "rotate-180"
            )} />
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="pt-4 space-y-4">
          {/* Platform Selection */}
          <div className="space-y-2">
            <Label className="text-sm">Platform ရွေးပါ</Label>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform.value}
                  type="button"
                  onClick={() => setOutroOptions({ 
                    ...outroOptions, 
                    platform: platform.value as any 
                  })}
                  className={cn(
                    "flex items-center gap-2 py-3 px-4 rounded-lg border text-sm transition-all",
                    outroOptions.platform === platform.value
                      ? "border-primary bg-primary/10"
                      : "hover:border-primary/50"
                  )}
                >
                  <span className="text-lg">{platform.icon}</span>
                  <span className={cn(
                    "font-medium",
                    outroOptions.platform === platform.value && platform.color
                  )}>
                    {platform.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Channel Name */}
          <div className="space-y-2">
            <Label className="text-sm">Channel / Page အမည်</Label>
            <Input
              placeholder="သင့် Channel အမည်..."
              value={outroOptions.channelName}
              onChange={(e) => setOutroOptions({ 
                ...outroOptions, 
                channelName: e.target.value 
              })}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Outro ကြာချိန်: {outroOptions.duration} စက္ကန့်
            </Label>
            <Slider
              value={[outroOptions.duration]}
              onValueChange={([value]) => setOutroOptions({ ...outroOptions, duration: value })}
              min={3}
              max={10}
              step={1}
              className="py-2"
            />
          </div>

          {/* Use Logo */}
          {logoOptions.enabled && logoOptions.imageUrl && (
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">Outro တွင် Logo ထည့်မည်</p>
                <p className="text-xs text-muted-foreground">Upload လုပ်ထားသော Logo ကို သုံးမည်</p>
              </div>
              <Switch
                checked={outroOptions.useUploadedLogo}
                onCheckedChange={(checked) => 
                  setOutroOptions({ ...outroOptions, useUploadedLogo: checked })
                }
              />
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Summary Card */}
      <div className="p-4 bg-gradient-to-br from-violet-50 to-pink-50 dark:from-violet-950/30 dark:to-pink-950/30 rounded-xl border">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          📋 ရွေးချယ်ထားသော Features
        </h3>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedFeatures.length > 0 ? (
            selectedFeatures.map((feature, i) => (
              <span 
                key={i}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
              >
                <CheckCircle2 className="h-3 w-3" />
                {feature}
              </span>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">
              Feature မရွေးချယ်ရသေးပါ
            </span>
          )}
        </div>

        {/* Video Info */}
        <div className="text-sm text-muted-foreground space-y-1">
          <p>📐 Format: {aspectRatio}</p>
          <p>🎤 Voice: {voiceId.includes('Nilar') ? 'Nilar (အမျိုးသမီး)' : 'Thiha (အမျိုးသား)'}</p>
        </div>
      </div>

      {/* Credit Cost Card */}
      <div className={cn(
        "p-4 rounded-xl border",
        hasCredits 
          ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" 
          : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-full",
              hasCredits ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"
            )}>
              <Coins className={cn(
                "h-5 w-5",
                hasCredits ? "text-green-600" : "text-red-600"
              )} />
            </div>
            <div>
              <p className="font-medium">Video ဖန်တီးခ</p>
              <p className="text-sm text-muted-foreground">
                လိုအပ်သော Credits: <strong>{creditsRequired}</strong>
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className={cn(
              "text-lg font-bold",
              hasCredits ? "text-green-600" : "text-red-600"
            )}>
              {user?.credit_balance || 0} Credits
            </p>
            <p className="text-xs text-muted-foreground">
              သင့်လက်ကျန်
            </p>
          </div>
        </div>

        {/* Warning if not enough credits */}
        {!hasCredits && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
            <AlertTriangle className="h-4 w-4" />
            <span>Credits မလုံလောက်ပါ။ ကျေးဇူးပြု၍ Credits ဝယ်ပါ။</span>
          </div>
        )}
      </div>

      {/* Estimated Time */}
      <div className="text-center text-sm text-muted-foreground">
        <Clock className="inline h-4 w-4 mr-1" />
        ခန့်မှန်း ကြာချိန်: <strong>၂-၃ မိနစ်</strong>
      </div>
    </div>
  );
}
