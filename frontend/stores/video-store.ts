/**
 * Video Store - Zustand store for video state management
 */
import { create } from 'zustand';
import { videoApi } from '@/lib/api';

export type VideoStatus =
  | 'pending'
  | 'extracting_transcript'
  | 'generating_script'
  | 'generating_audio'
  | 'rendering_video'
  | 'uploading'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface Video {
  id: string;
  user_id: string;
  source_url: string;
  source_title?: string;
  source_thumbnail?: string;
  source_duration_seconds?: number;
  title?: string;
  transcript?: string;
  script?: string;
  voice_type: string;
  output_language: string;
  output_resolution: string;
  video_url?: string;
  audio_url?: string;
  file_size_bytes?: number;
  status: VideoStatus;
  status_message?: string;
  progress_percent: number;
  credits_used: number;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

interface VideoListResponse {
  videos: Video[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface VideoState {
  videos: Video[];
  currentVideo: Video | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };

  // Actions
  fetchVideos: (page?: number, pageSize?: number) => Promise<void>;
  fetchVideo: (id: string) => Promise<void>;
  createVideo: (data: CreateVideoData) => Promise<Video>;
  cancelVideo: (id: string) => Promise<void>;
  setCurrentVideo: (video: Video | null) => void;
  updateVideoStatus: (id: string, status: VideoStatus, progress?: number) => void;
  clearError: () => void;
}

export interface VideoOptionsData {
  aspect_ratio?: string;
  copyright?: {
    color_adjust?: boolean;
    horizontal_flip?: boolean;
    slight_zoom?: boolean;
    audio_pitch_shift?: boolean;
  };
  subtitles?: {
    enabled?: boolean;
    size?: string;
    position?: string;
    background?: string;
    color?: string;
    word_highlight?: boolean;
  };
  logo?: {
    enabled?: boolean;
    image_path?: string;
    position?: string;
    size?: string;
    opacity?: number;
  };
  outro?: {
    enabled?: boolean;
    platform?: string;
    channel_name?: string;
    logo_path?: string;
    duration?: number;
  };
}

export interface CreateVideoData {
  source_url: string;
  voice_type?: string;
  output_language?: string;
  output_resolution?: string;
  options?: VideoOptionsData;
}

export const useVideoStore = create<VideoState>((set, get) => ({
  videos: [],
  currentVideo: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  },

  fetchVideos: async (page = 1, pageSize = 10) => {
    set({ isLoading: true, error: null });
    try {
      const response = await videoApi.list(page, pageSize);
      const data: VideoListResponse = response.data;
      
      set({
        videos: data.videos,
        pagination: {
          page: data.page,
          pageSize: data.page_size,
          total: data.total,
          totalPages: data.total_pages,
        },
        isLoading: false,
      });
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to fetch videos';
      set({ error: message, isLoading: false });
    }
  },

  fetchVideo: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await videoApi.get(id);
      set({ currentVideo: response.data, isLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to fetch video';
      set({ error: message, isLoading: false });
    }
  },

  createVideo: async (data: CreateVideoData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await videoApi.create({
        source_url: data.source_url,
        voice_type: data.voice_type,
        output_language: data.output_language,
        options: data.options,
      });
      
      const video: Video = response.data;
      
      set((state) => ({
        videos: [video, ...state.videos],
        currentVideo: video,
        isLoading: false,
      }));
      
      return video;
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to create video';
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  cancelVideo: async (id: string) => {
    try {
      await videoApi.delete(id);
      set((state) => ({
        videos: state.videos.filter((v) => v.id !== id),
        currentVideo: state.currentVideo?.id === id ? null : state.currentVideo,
      }));
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to cancel video';
      set({ error: message });
    }
  },

  setCurrentVideo: (video: Video | null) => {
    set({ currentVideo: video });
  },

  updateVideoStatus: (id: string, status: VideoStatus, progress?: number) => {
    set((state) => ({
      videos: state.videos.map((v) =>
        v.id === id
          ? { ...v, status, progress_percent: progress ?? v.progress_percent }
          : v
      ),
      currentVideo:
        state.currentVideo?.id === id
          ? { ...state.currentVideo, status, progress_percent: progress ?? state.currentVideo.progress_percent }
          : state.currentVideo,
    }));
  },

  clearError: () => set({ error: null }),
}));
