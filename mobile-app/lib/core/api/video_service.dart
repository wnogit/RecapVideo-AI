import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_client.dart';
import 'api_endpoints.dart';
import '../providers/api_provider.dart';

/// Video model for API
class Video {
  final String id;
  final String title;
  final String sourceUrl;
  final String? sourceThumbnail;
  final String status;
  final int progressPercent;
  final String? videoUrl;
  final String? statusMessage;
  final DateTime createdAt;

  Video({
    required this.id,
    required this.title,
    required this.sourceUrl,
    this.sourceThumbnail,
    required this.status,
    this.progressPercent = 0,
    this.videoUrl,
    this.statusMessage,
    required this.createdAt,
  });

  factory Video.fromJson(Map<String, dynamic> json) {
    return Video(
      id: json['id'] ?? '',
      title: json['title'] ?? json['source_title'] ?? 'Untitled',
      sourceUrl: json['source_url'] ?? '',
      sourceThumbnail: json['source_thumbnail'],
      status: json['status'] ?? 'pending',
      progressPercent: json['progress_percent'] ?? 0,
      videoUrl: json['video_url'],
      statusMessage: json['status_message'],
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at']) 
          : DateTime.now(),
    );
  }
}

/// Video creation request
class CreateVideoRequest {
  final String sourceUrl;
  final String voiceId;
  final String language;
  final String aspectRatio;
  final Map<String, dynamic>? copyrightOptions;
  final Map<String, dynamic>? subtitleOptions;
  final Map<String, dynamic>? logoOptions;
  final Map<String, dynamic>? outroOptions;

  CreateVideoRequest({
    required this.sourceUrl,
    required this.voiceId,
    required this.language,
    required this.aspectRatio,
    this.copyrightOptions,
    this.subtitleOptions,
    this.logoOptions,
    this.outroOptions,
  });

  Map<String, dynamic> toJson() => {
    'source_url': sourceUrl,
    'voice_id': voiceId,
    'language': language,
    'aspect_ratio': aspectRatio,
    if (copyrightOptions != null) 'copyright_options': copyrightOptions,
    if (subtitleOptions != null) 'subtitle_options': subtitleOptions,
    if (logoOptions != null) 'logo_options': logoOptions,
    if (outroOptions != null) 'outro_options': outroOptions,
  };
}

/// Video API Service
class VideoService {
  final ApiClient _client;

  VideoService(this._client);

  /// Get all videos for current user
  Future<List<Video>> getVideos() async {
    try {
      final response = await _client.get(ApiEndpoints.videos);
      // Backend returns: { videos: [...], total, page, page_size, total_pages }
      final responseData = response.data;
      List<dynamic> videosArray;
      
      if (responseData is Map) {
        // Try 'videos' first (backend format), then 'data', then root
        videosArray = responseData['videos'] ?? responseData['data'] ?? [];
      } else if (responseData is List) {
        videosArray = responseData;
      } else {
        videosArray = [];
      }
      
      return videosArray.map((json) => Video.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to fetch videos: $e');
    }
  }

  /// Get single video by ID
  Future<Video> getVideo(String id) async {
    try {
      final response = await _client.get(ApiEndpoints.videoDetail(id));
      return Video.fromJson(response.data['data'] ?? response.data);
    } catch (e) {
      throw Exception('Failed to fetch video: $e');
    }
  }

  /// Create new video
  Future<Video> createVideo(CreateVideoRequest request) async {
    try {
      dynamic data;
      
      // Check if we need to send multipart/form-data (for Logo file)
      final logoPath = request.logoOptions?['file_path'] as String?;
      
      if (logoPath != null && logoPath.isNotEmpty) {
        // Use FormData
        final map = request.toJson();
        // Remove file_path from nested map if needed, but FormData handles flat or array fields best.
        // For nested objects like 'copyright_options', we might need to JSON encode them 
        // OR Dio's FormData handles map structures? Dio handles maps.
        // But files need 'MultipartFile'.
        
        final formData = FormData.fromMap({
          ...map,
          'logo_file': await MultipartFile.fromFile(logoPath),
        });
        
        data = formData;
      } else {
        // JSON
        data = request.toJson();
      }

      final response = await _client.post(
        ApiEndpoints.videos,
        data: data,
      );
      return Video.fromJson(response.data['data'] ?? response.data);
    } catch (e) {
      throw Exception('Failed to create video: $e');
    }
  }

  /// Delete video
  Future<void> deleteVideo(String id) async {
    try {
      await _client.delete(ApiEndpoints.videoDetail(id));
    } catch (e) {
      throw Exception('Failed to delete video: $e');
    }
  }

  /// Poll video status
  Future<Video> getVideoStatus(String id) async {
    try {
      final response = await _client.get(ApiEndpoints.videoStatus(id));
      return Video.fromJson(response.data['data'] ?? response.data);
    } catch (e) {
      throw Exception('Failed to get video status: $e');
    }
  }
}

/// Provider for video service
final videoServiceProvider = Provider<VideoService>((ref) {
  return VideoService(ref.watch(apiClientProvider));
});
