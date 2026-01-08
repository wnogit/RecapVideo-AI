/**
 * useVideos Hook - Video management utilities
 */
'use client';

import { useEffect, useCallback } from 'react';
import { useVideoStore, CreateVideoData } from '@/stores/video-store';

export function useVideos(autoFetch: boolean = true) {
  const {
    videos,
    isLoading,
    error,
    pagination,
    fetchVideos,
    clearError,
  } = useVideoStore();

  useEffect(() => {
    if (autoFetch && videos.length === 0) {
      fetchVideos();
    }
  }, [autoFetch]);

  const loadMore = useCallback(() => {
    if (pagination.page < pagination.totalPages) {
      fetchVideos(pagination.page + 1, pagination.pageSize);
    }
  }, [pagination, fetchVideos]);

  const refresh = useCallback(() => {
    fetchVideos(1, pagination.pageSize);
  }, [fetchVideos, pagination.pageSize]);

  return {
    videos,
    isLoading,
    error,
    pagination,
    loadMore,
    refresh,
    clearError,
    hasMore: pagination.page < pagination.totalPages,
  };
}

export function useVideo(videoId: string) {
  const { currentVideo, isLoading, error, fetchVideo, cancelVideo } = useVideoStore();

  useEffect(() => {
    if (videoId) {
      fetchVideo(videoId);
    }
  }, [videoId]);

  return {
    video: currentVideo,
    isLoading,
    error,
    cancel: () => cancelVideo(videoId),
  };
}

export function useCreateVideo() {
  const { createVideo, isLoading, error, clearError } = useVideoStore();

  const create = async (data: {
    url: string;
    voice?: string;
    language?: string;
    resolution?: string;
    options?: {
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
    };
  }) => {
    return createVideo({
      source_url: data.url,
      voice_type: data.voice,
      output_language: data.language,
      output_resolution: data.resolution,
      options: data.options,
    });
  };

  return {
    create,
    isLoading,
    error,
    clearError,
  };
}

export type { CreateVideoData } from '@/stores/video-store';
