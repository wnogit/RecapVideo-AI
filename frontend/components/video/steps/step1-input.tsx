'use client';

/**
 * Step 1: Input
 * YouTube URL and Voice Selection
 */
import { useState, useEffect, useRef } from 'react';
import { useVideoCreationStore } from '@/stores/video-creation-store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Link2, AlertCircle, CheckCircle2, Mic, Volume2, Loader2, Square, ClipboardPaste, Languages, ChevronDown } from 'lucide-react';
import { detectPlatform, isSupportedUrl, isYoutubeShortsUrl, isRegularYoutubeUrl, getPlatformInfo, type VideoPlatform } from '@/lib/video-url';
import { AspectRatio, FORMAT_OPTIONS } from '@/lib/types/video-options';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Output language options - matching backend SUPPORTED_LANGUAGES
const OUTPUT_LANGUAGES = [
  { id: 'my', name: 'မြန်မာ (Burmese)', flag: '🇲🇲' },
  { id: 'th', name: 'ไทย (Thai)', flag: '🇹🇭' },
  { id: 'zh', name: '中文 (Chinese)', flag: '🇨🇳' },
  { id: 'en', name: 'English (Rewrite)', flag: '🇺🇸' },
];

// Voice sample URLs - stored in backend static folder
const VOICE_SAMPLE_URLS: Record<string, string> = {
  'my-MM-NilarNeural': '/api/v1/static/voice-samples/nilar-sample.mp3',
  'my-MM-ThihaNeural': '/api/v1/static/voice-samples/thiha-sample.mp3',
};

// Available voices (Burmese)
const VOICES = [
  {
    id: 'my-MM-NilarNeural',
    name: 'Nilar',
    gender: 'female' as const,
    description: 'Female Voice',
    isPopular: true,
  },
  {
    id: 'my-MM-ThihaNeural',
    name: 'Thiha',
    gender: 'male' as const,
    description: 'Male Voice',
    isPopular: false,
  },
];

export function Step1Input() {
  const {
    sourceUrl,
    outputLanguage,
    voiceId,
    aspectRatio,
    setSourceUrl,
    setOutputLanguage,
    setVoiceId,
    setAspectRatio,
    isStep1Valid,
  } = useVideoCreationStore();

  const [urlTouched, setUrlTouched] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [loadingVoice, setLoadingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Multi-platform URL detection
  const { platform, videoId } = detectPlatform(sourceUrl);
  const isValidUrl = isSupportedUrl(sourceUrl);
  const isValidShorts = isYoutubeShortsUrl(sourceUrl);
  const isRegularYoutube = isRegularYoutubeUrl(sourceUrl) && !isValidShorts;
  const showError = urlTouched && sourceUrl && !isValidUrl;
  const platformInfo = platform !== 'unknown' ? getPlatformInfo(platform) : null;

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Handle URL change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrlTouched(true);
    setSourceUrl(e.target.value);
  };

  // Play voice sample
  const handlePlayVoiceSample = async (voiceIdToPlay: string) => {
    // If already playing this voice, stop it
    if (playingVoice === voiceIdToPlay) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingVoice(null);
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    setLoadingVoice(voiceIdToPlay);

    try {
      const sampleUrl = VOICE_SAMPLE_URLS[voiceIdToPlay];
      if (!sampleUrl) {
        console.warn('No sample URL for voice:', voiceIdToPlay);
        setLoadingVoice(null);
        return;
      }

      audioRef.current = new Audio(sampleUrl);
      audioRef.current.onended = () => setPlayingVoice(null);
      audioRef.current.onerror = () => {
        console.error('Failed to load voice sample');
        setPlayingVoice(null);
        setLoadingVoice(null);
      };
      audioRef.current.oncanplaythrough = () => {
        setLoadingVoice(null);
        setPlayingVoice(voiceIdToPlay);
        audioRef.current?.play();
      };
    } catch (error) {
      console.error('Error playing voice sample:', error);
      setLoadingVoice(null);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-4">
      {/* Section Header */}
      <div>
        <h2 className="text-lg lg:text-base font-semibold flex items-center gap-2">
          🎬 Video အချက်အလက်
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          YouTube, TikTok, သို့မဟုတ် Facebook URL ထည့်ပြီး Voice ရွေးချယ်ပါ
        </p>
      </div>

      {/* Video URL Input */}
      <div className="space-y-2">
        <Label htmlFor="url" className="text-sm font-medium">
          Video URL (YouTube, TikTok, Facebook)
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="url"
              type="url"
              placeholder="YouTube, TikTok, or Facebook video URL..."
              className={cn(
                "pl-9 pr-10 h-10 text-sm",
                isValidUrl && "border-green-500 focus-visible:ring-green-500",
                showError && "border-destructive focus-visible:ring-destructive"
              )}
              value={sourceUrl}
              onChange={handleUrlChange}
              onBlur={() => setUrlTouched(true)}
            />
            {/* Status Icon - centered vertically */}
            {sourceUrl && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isValidUrl ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
            )}
          </div>
          {/* Paste Button - same height as input */}
          <button
            type="button"
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText();
                setUrlTouched(true);
                setSourceUrl(text);
              } catch (err) {
                console.error('Failed to read clipboard:', err);
              }
            }}
            className={cn(
              "h-10 px-3 rounded-lg border text-muted-foreground flex items-center gap-2",
              "transition-all duration-200 hover:bg-accent hover:text-foreground hover:border-primary/50",
              "active:scale-95"
            )}
            title="URL ကို Paste လုပ်ရန်"
          >
            <ClipboardPaste className="h-4 w-4" />
            <span className="hidden sm:inline text-sm">Paste</span>
          </button>
        </div>

        {/* Error Messages */}
        {showError && (
          <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">URL မမှန်ကန်ပါ</p>
              <p className="text-xs mt-1 opacity-80">
                YouTube, TikTok, သို့မဟုတ် Facebook video URL ထည့်ပါ
              </p>
            </div>
          </div>
        )}

        {/* Platform Detection - Simple inline text without box */}
        {isValidUrl && platformInfo && (
          <div className="flex items-center gap-2 text-sm mt-1">
            {/* Platform Logo - smaller */}
            {platform === 'youtube' && (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            )}
            {platform === 'tiktok' && (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
              </svg>
            )}
            {platform === 'facebook' && (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            )}

            {/* Platform Name */}
            <span className="text-muted-foreground">
              {platformInfo.name}
              {platform === 'youtube' && isValidShorts && ' Shorts'}
            </span>

            {/* Green Checkmark */}
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </div>
        )}
      </div>

      {/* Output Language Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Languages className="h-4 w-4" />
          Output Language
        </Label>

        <Select value={outputLanguage} onValueChange={setOutputLanguage}>
          <SelectTrigger className="h-10 lg:h-9 text-sm">
            <SelectValue>
              <span className="flex items-center gap-2">
                <span className="text-lg">{OUTPUT_LANGUAGES.find(l => l.id === outputLanguage)?.flag}</span>
                <span>{OUTPUT_LANGUAGES.find(l => l.id === outputLanguage)?.name}</span>
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {OUTPUT_LANGUAGES.map((lang) => (
              <SelectItem key={lang.id} value={lang.id} className="py-3">
                <span className="flex items-center gap-2">
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Video ကို ဘာသာပြန်မည့် ဘာသာစကား ရွေးချယ်ပါ
        </p>
      </div>

      {/* Voice Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Mic className="h-4 w-4" />
          Voice ရွေးချယ်ပါ
        </Label>

        {/* Scrollable container for many voices */}
        <RadioGroup
          value={voiceId}
          onValueChange={setVoiceId}
          className="grid grid-cols-2 gap-2 max-h-[220px] lg:max-h-[180px] overflow-y-auto pr-1"
        >
          {VOICES.map((voice) => (
            <div key={voice.id}>
              <RadioGroupItem
                value={voice.id}
                id={voice.id}
                className="peer sr-only"
              />
              <Label
                htmlFor={voice.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border-2 p-3 cursor-pointer transition-all",
                  "hover:bg-accent hover:border-accent-foreground/20",
                  "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5",
                  voiceId === voice.id && "border-primary bg-primary/5"
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0",
                  voice.gender === 'female'
                    ? "bg-pink-100 dark:bg-pink-900/50"
                    : "bg-blue-100 dark:bg-blue-900/50"
                )}>
                  {voice.gender === 'female' ? '👩' : '👨'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{voice.name}</span>
                    {voice.isPopular && (
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded">
                        ⭐ Popular
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground block mt-0.5">
                    {voice.description}
                  </span>

                  {/* Play Sample Button */}
                  <button
                    type="button"
                    className={cn(
                      "mt-1.5 flex items-center gap-1 text-xs transition-colors",
                      playingVoice === voice.id
                        ? "text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePlayVoiceSample(voice.id);
                    }}
                    disabled={loadingVoice === voice.id}
                  >
                    {loadingVoice === voice.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : playingVoice === voice.id ? (
                      <Square className="h-3 w-3 fill-current" />
                    ) : (
                      <Volume2 className="h-3 w-3" />
                    )}
                    {playingVoice === voice.id ? 'Stop' : 'Preview'}
                  </button>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Aspect Ratio (Quick Select) */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          📐 Video Format
        </Label>

        <div className="flex flex-wrap gap-2">
          {FORMAT_OPTIONS.map((format) => (
            <button
              key={format.value}
              type="button"
              onClick={() => {
                setAspectRatio(format.value);
              }}
              className={cn(
                "px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200",
                "hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-[0.98]",
                aspectRatio === format.value
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-muted hover:border-primary/50 hover:bg-accent"
              )}
            >
              {format.icon} {format.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {aspectRatio === '9:16' && '📱 TikTok/Shorts အတွက် အကြံပြုပါတယ်'}
          {aspectRatio === '16:9' && '🖥️ YouTube/Landscape ဗီဒီယို အတွက် အကြံပြုပါတယ်'}
          {aspectRatio === '1:1' && '⬜ Instagram/Facebook Post အတွက် အကြံပြုပါတယ်'}
          {aspectRatio === '4:5' && '📷 Instagram Portrait Feed အတွက် အကြံပြုပါတယ်'}
        </p>
      </div>
    </div>
  );
}
