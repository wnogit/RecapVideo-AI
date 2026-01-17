/**
 * Video Options Types
 * All configuration options for video creation
 */

// Voice Configuration
export interface Voice {
  id: string;
  name: string;
  gender: 'female' | 'male';
  style: string;
  provider: 'edge' | 'gemini';
  sampleUrl: string;
  isPopular?: boolean;
  isPremium?: boolean;
}

// Video Format Options
export type AspectRatio = '9:16' | '16:9' | '1:1' | '4:5' | 'custom';

export interface FormatOption {
  value: AspectRatio;
  label: string;
  description: string;
  icon: string;
}

export const FORMAT_OPTIONS: FormatOption[] = [
  { value: '9:16', label: '9:16 Vertical', description: 'TikTok / Shorts', icon: '📱' },
  { value: '16:9', label: '16:9 Horizontal', description: 'YouTube', icon: '🖥️' },
  { value: '1:1', label: '1:1 Square', description: 'Instagram', icon: '⬜' },
  { value: '4:5', label: '4:5 Portrait', description: 'IG Feed', icon: '📷' },
  { value: 'custom', label: 'Custom Crop', description: 'Free crop', icon: '✂️' },
];

// Copyright Protection Options
export interface CopyrightOptions {
  colorAdjust: boolean;     // Brightness, contrast, saturation adjustment
  horizontalFlip: boolean;  // Mirror the video
  slightZoom: boolean;      // 5% zoom
  audioPitchShift: boolean; // Audio pitch change enabled
  pitchValue: number;       // Pitch multiplier (0.5 - 1.5, default 1.0)
}

export const DEFAULT_COPYRIGHT_OPTIONS: CopyrightOptions = {
  colorAdjust: false,
  horizontalFlip: false,
  slightZoom: false,
  audioPitchShift: false,
  pitchValue: 1.0,
};

// Blur Options (Custom Region Blur - to mask watermarks/logos)
export type BlurType = 'gaussian' | 'box';

// Single blur region (percentage-based for responsiveness)
export interface BlurRegion {
  id: string;
  x: number;      // Left position (0-100%)
  y: number;      // Top position (0-100%)
  width: number;  // Width (0-100%)
  height: number; // Height (0-100%)
}

export interface BlurOptions {
  enabled: boolean;
  intensity: number;     // 1-30 (blur strength)
  blurType: BlurType;    // gaussian (smooth) or box (blocky)
  regions: BlurRegion[]; // Array of blur regions
}

export const DEFAULT_BLUR_OPTIONS: BlurOptions = {
  enabled: false,
  intensity: 15,
  blurType: 'gaussian',
  regions: [],
};

// Custom Crop Options
export interface CropOptions {
  enabled: boolean;
  x: number;       // Left position (0-100%)
  y: number;       // Top position (0-100%)
  width: number;   // Width (0-100%)
  height: number;  // Height (0-100%)
}

export const DEFAULT_CROP_OPTIONS: CropOptions = {
  enabled: false,
  x: 0,
  y: 0,
  width: 100,
  height: 100,
};

// Subtitle Options
export type SubtitlePosition = 'top' | 'center' | 'bottom';
export type SubtitleBackground = 'none' | 'semi' | 'solid';
export type SubtitleSize = 'small' | 'medium' | 'large';

export interface SubtitleOptions {
  enabled: boolean;
  font: string;
  size: SubtitleSize;
  position: SubtitlePosition;
  background: SubtitleBackground;
  color: string;
  wordHighlight: boolean; // Karaoke style
}

export const DEFAULT_SUBTITLE_OPTIONS: SubtitleOptions = {
  enabled: true,
  font: 'Pyidaungsu',
  size: 'large',
  position: 'bottom',
  background: 'semi',
  color: '#FFFFFF',
  wordHighlight: true,
};

// Logo Options
export type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type LogoSize = 'small' | 'medium' | 'large';

export interface LogoOptions {
  enabled: boolean;
  imageUrl?: string;
  position: LogoPosition;
  size: LogoSize;
  opacity: number; // 0-100
}

export const DEFAULT_LOGO_OPTIONS: LogoOptions = {
  enabled: false,
  position: 'top-right',
  size: 'medium',
  opacity: 70,
};

// Outro Options
export type OutroPlatform = 'youtube' | 'tiktok' | 'facebook' | 'instagram';

export interface OutroOptions {
  enabled: boolean;
  platform: OutroPlatform;
  channelName: string;
  useUploadedLogo: boolean;
  duration: number; // seconds (default 5)
}

export const DEFAULT_OUTRO_OPTIONS: OutroOptions = {
  enabled: false,
  platform: 'youtube',
  channelName: '',
  useUploadedLogo: true,
  duration: 5,
};

// AI Avatar Options
export type AvatarStyle = 'cartoon-female' | 'cartoon-male' | 'realistic-female' | 'realistic-male';
export type AvatarPosition = 'bottom-left' | 'bottom-right' | 'bottom-center';
export type AvatarSize = 'small' | 'medium' | 'large';

export interface AvatarOptions {
  enabled: boolean;
  style: AvatarStyle;
  position: AvatarPosition;
  size: AvatarSize;
}

export const DEFAULT_AVATAR_OPTIONS: AvatarOptions = {
  enabled: false,
  style: 'cartoon-female',
  position: 'bottom-right',
  size: 'medium',
};

// Effects Options
export type BorderStyle = 'none' | 'line' | 'neon' | 'gradient';
export type ColorFilter = 'none' | 'warm' | 'cool' | 'cinematic';

export interface EffectsOptions {
  blurBackground: boolean;
  borderStyle: BorderStyle;
  colorFilter: ColorFilter;
}

export const DEFAULT_EFFECTS_OPTIONS: EffectsOptions = {
  blurBackground: false,
  borderStyle: 'none',
  colorFilter: 'none',
};

// Thumbnail Options
export type ThumbnailStyle = 'clickbait' | 'clean' | 'news' | 'minimal';

export interface ThumbnailOptions {
  enabled: boolean;
  style: ThumbnailStyle;
  customTitle?: string;
}

export const DEFAULT_THUMBNAIL_OPTIONS: ThumbnailOptions = {
  enabled: true,
  style: 'clickbait',
};

// Complete Video Options
export interface VideoOptions {
  // Basic
  sourceUrl: string;
  voiceId: string;
  aspectRatio: AspectRatio;

  // Advanced Options
  copyright: CopyrightOptions;
  subtitles: SubtitleOptions;
  logo: LogoOptions;
  outro: OutroOptions;
  avatar: AvatarOptions;
  effects: EffectsOptions;
  thumbnail: ThumbnailOptions;
}

export const DEFAULT_VIDEO_OPTIONS: Omit<VideoOptions, 'sourceUrl'> = {
  voiceId: 'my-MM-NilarNeural',
  aspectRatio: '9:16',
  copyright: DEFAULT_COPYRIGHT_OPTIONS,
  subtitles: DEFAULT_SUBTITLE_OPTIONS,
  logo: DEFAULT_LOGO_OPTIONS,
  outro: DEFAULT_OUTRO_OPTIONS,
  avatar: DEFAULT_AVATAR_OPTIONS,
  effects: DEFAULT_EFFECTS_OPTIONS,
  thumbnail: DEFAULT_THUMBNAIL_OPTIONS,
};

// Available Voices
export const AVAILABLE_VOICES: Voice[] = [
  {
    id: 'my-MM-NilarNeural',
    name: 'Nilar',
    gender: 'female',
    style: 'Natural, Clear',
    provider: 'edge',
    sampleUrl: '/voice-samples/nilar.mp3',
    isPopular: true,
  },
  {
    id: 'my-MM-ThihaNeural',
    name: 'Thiha',
    gender: 'male',
    style: 'Deep, Professional',
    provider: 'edge',
    sampleUrl: '/voice-samples/thiha.mp3',
  },
];
