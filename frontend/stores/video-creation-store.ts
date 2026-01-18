/**
 * Video Creation Store
 * Manages state for the multi-step video creation wizard
 */
import { create } from 'zustand';
import { isYoutubeShortsUrl } from '@/lib/youtube';
import {
  AspectRatio,
  CopyrightOptions,
  BlurOptions,
  BlurRegion,
  CropOptions,
  SubtitleOptions,
  LogoOptions,
  OutroOptions,
  DEFAULT_COPYRIGHT_OPTIONS,
  DEFAULT_BLUR_OPTIONS,
  DEFAULT_CROP_OPTIONS,
  DEFAULT_SUBTITLE_OPTIONS,
  DEFAULT_LOGO_OPTIONS,
  DEFAULT_OUTRO_OPTIONS,
} from '@/lib/types/video-options';

// Step definitions
export type CreationStep = 1 | 2 | 3;

export interface VideoCreationState {
  // Current step
  currentStep: CreationStep;

  // Step 1: Input
  sourceUrl: string;
  outputLanguage: string;
  voiceId: string;
  aspectRatio: AspectRatio;

  // Step 2: Styles
  copyrightOptions: CopyrightOptions;
  blurOptions: BlurOptions;
  cropOptions: CropOptions;
  subtitleOptions: SubtitleOptions;
  logoOptions: LogoOptions;

  // Step 3: Branding
  outroOptions: OutroOptions;

  // Validation
  isStep1Valid: boolean;
  isStep2Valid: boolean;
  isStep3Valid: boolean;

  // UI State
  isSubmitting: boolean;
  error: string | null;

  // Actions
  setStep: (step: CreationStep) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Step 1 Actions
  setSourceUrl: (url: string) => void;
  setOutputLanguage: (lang: string) => void;
  setVoiceId: (id: string) => void;
  setAspectRatio: (ratio: AspectRatio) => void;

  // Step 2 Actions
  setCopyrightOptions: (options: CopyrightOptions) => void;
  setBlurOptions: (options: BlurOptions) => void;
  addBlurRegion: (region: BlurRegion) => void;
  updateBlurRegion: (id: string, updates: Partial<BlurRegion>) => void;
  removeBlurRegion: (id: string) => void;
  setCropOptions: (options: CropOptions) => void;
  setSubtitleOptions: (options: SubtitleOptions) => void;
  setLogoOptions: (options: LogoOptions) => void;

  // Step 3 Actions
  setOutroOptions: (options: OutroOptions) => void;

  // Form Actions
  setSubmitting: (isSubmitting: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Get all options for submission
  getSubmissionData: () => {
    source_url: string;
    voice_type: string;
    output_language: string;
    options: {
      aspect_ratio: string;
      copyright: Record<string, any>;
      subtitles: Record<string, any>;
      logo: Record<string, any>;
      outro: Record<string, any>;
    };
  };
}

export const useVideoCreationStore = create<VideoCreationState>((set, get) => ({
  // Initial state
  currentStep: 1,

  // Step 1
  sourceUrl: '',
  outputLanguage: 'my',
  voiceId: 'my-MM-NilarNeural',
  aspectRatio: '9:16',

  // Step 2
  copyrightOptions: DEFAULT_COPYRIGHT_OPTIONS,
  blurOptions: DEFAULT_BLUR_OPTIONS,
  cropOptions: DEFAULT_CROP_OPTIONS,
  subtitleOptions: DEFAULT_SUBTITLE_OPTIONS,
  logoOptions: DEFAULT_LOGO_OPTIONS,

  // Step 3
  outroOptions: DEFAULT_OUTRO_OPTIONS,

  // Validation
  isStep1Valid: false,
  isStep2Valid: true, // Always valid (has defaults)
  isStep3Valid: true, // Always valid (has defaults)

  // UI State
  isSubmitting: false,
  error: null,

  // Step Navigation
  setStep: (step) => set({ currentStep: step }),

  nextStep: () => {
    const { currentStep, isStep1Valid, isStep2Valid } = get();
    if (currentStep === 1 && isStep1Valid) {
      set({ currentStep: 2 });
    } else if (currentStep === 2 && isStep2Valid) {
      set({ currentStep: 3 });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 1) {
      set({ currentStep: (currentStep - 1) as CreationStep });
    }
  },

  // Step 1 Actions
  setSourceUrl: (url) => {
    const isValid = isYoutubeShortsUrl(url);
    set({ sourceUrl: url, isStep1Valid: isValid });
  },

  setOutputLanguage: (lang) => set({ outputLanguage: lang }),

  setVoiceId: (id) => set({ voiceId: id }),

  setAspectRatio: (ratio) => {
    set({ aspectRatio: ratio });
  },

  // Step 2 Actions
  setCopyrightOptions: (options) => set({ copyrightOptions: options }),

  setBlurOptions: (options) => set({ blurOptions: options }),

  addBlurRegion: (region) => {
    const { blurOptions } = get();
    set({
      blurOptions: {
        ...blurOptions,
        enabled: true,
        regions: [...blurOptions.regions, region],
      },
    });
  },

  updateBlurRegion: (id, updates) => {
    const { blurOptions } = get();
    set({
      blurOptions: {
        ...blurOptions,
        regions: blurOptions.regions.map((r) =>
          r.id === id ? { ...r, ...updates } : r
        ),
      },
    });
  },

  removeBlurRegion: (id) => {
    const { blurOptions } = get();
    const newRegions = blurOptions.regions.filter((r) => r.id !== id);
    set({
      blurOptions: {
        ...blurOptions,
        enabled: newRegions.length > 0,
        regions: newRegions,
      },
    });
  },

  setCropOptions: (options) => set({ cropOptions: options }),

  setSubtitleOptions: (options) => set({ subtitleOptions: options }),

  setLogoOptions: (options) => {
    // Validate: if logo is enabled, imageUrl must be provided
    const isValid = !options.enabled || (options.enabled && !!options.imageUrl);
    set({ logoOptions: options, isStep2Valid: isValid });
  },

  // Step 3 Actions
  setOutroOptions: (options) => set({ outroOptions: options }),

  // Form Actions
  setSubmitting: (isSubmitting) => set({ isSubmitting }),

  setError: (error) => set({ error }),

  reset: () => set({
    currentStep: 1,
    sourceUrl: '',
    outputLanguage: 'my',
    voiceId: 'my-MM-NilarNeural',
    aspectRatio: '9:16',
    copyrightOptions: DEFAULT_COPYRIGHT_OPTIONS,
    blurOptions: DEFAULT_BLUR_OPTIONS,
    cropOptions: DEFAULT_CROP_OPTIONS,
    subtitleOptions: DEFAULT_SUBTITLE_OPTIONS,
    logoOptions: DEFAULT_LOGO_OPTIONS,
    outroOptions: DEFAULT_OUTRO_OPTIONS,
    isStep1Valid: false,
    isStep2Valid: true,
    isStep3Valid: true,
    isSubmitting: false,
    error: null,
  }),

  // Get submission data
  getSubmissionData: () => {
    const state = get();
    return {
      source_url: state.sourceUrl,
      voice_type: state.voiceId,
      output_language: state.outputLanguage,
      options: {
        aspect_ratio: state.aspectRatio,
        blur: {
          enabled: state.blurOptions.enabled,
          intensity: state.blurOptions.intensity,
          blur_type: state.blurOptions.blurType,
          regions: state.blurOptions.regions.map((r) => ({
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
          })),
        },
        copyright: {
          color_adjust: state.copyrightOptions.colorAdjust,
          horizontal_flip: state.copyrightOptions.horizontalFlip,
          slight_zoom: state.copyrightOptions.slightZoom,
          audio_pitch_shift: state.copyrightOptions.audioPitchShift,
          pitch_value: state.copyrightOptions.pitchValue,
        },
        crop: {
          enabled: state.aspectRatio === 'custom',
          x: state.cropOptions.x,
          y: state.cropOptions.y,
          width: state.cropOptions.width,
          height: state.cropOptions.height,
        },
        subtitles: {
          enabled: state.subtitleOptions.enabled,
          size: state.subtitleOptions.size,
          position: state.subtitleOptions.position,
          background: state.subtitleOptions.background,
          color: state.subtitleOptions.color,
          word_highlight: state.subtitleOptions.wordHighlight,
        },
        logo: {
          enabled: state.logoOptions.enabled,
          image_url: state.logoOptions.imageUrl,
          position: state.logoOptions.position,
          size: state.logoOptions.size,
          opacity: state.logoOptions.opacity,
        },
        outro: {
          enabled: state.outroOptions.enabled,
          platform: state.outroOptions.platform,
          channel_name: state.outroOptions.channelName,
          use_logo: state.outroOptions.useUploadedLogo && !!state.logoOptions.imageUrl,
          duration: state.outroOptions.duration,
        },
      },
    };
  },
}));
