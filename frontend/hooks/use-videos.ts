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
  }) => {
    return createVideo({
      source_url: data.url,
      voice_type: data.voice,
      output_language: data.language,
      output_resolution: data.resolution,
    });
  };

  return {
    create,
    isLoading,
    error,
    clearError,
  };
}

interface CreateVideoData {
  source_url: string;
  voice_type?: string;
  output_language?: string;
  output_resolution?: string;
}
