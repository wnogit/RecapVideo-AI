import 'package:flutter_test/flutter_test.dart';
import 'package:recapvideo_mobile/core/api/video_service.dart';

void main() {
  group('Video Model Tests', () {
    test('Video.fromJson creates valid video', () {
      final json = {
        'id': '123',
        'title': 'Test Video',
        'source_url': 'https://youtube.com/shorts/abc',
        'source_thumbnail': 'https://i.ytimg.com/vi/abc/oar2.jpg',
        'status': 'completed',
        'progress_percent': 100,
        'video_url': 'https://cdn.recapvideo.ai/videos/123.mp4',
        'created_at': '2026-01-13T00:00:00Z',
      };

      final video = Video.fromJson(json);

      expect(video.id, '123');
      expect(video.title, 'Test Video');
      expect(video.sourceUrl, 'https://youtube.com/shorts/abc');
      expect(video.status, 'completed');
      expect(video.progressPercent, 100);
      expect(video.videoUrl, isNotNull);
    });

    test('Video.fromJson handles missing fields', () {
      final json = {
        'id': '456',
      };

      final video = Video.fromJson(json);

      expect(video.id, '456');
      expect(video.title, 'Untitled');
      expect(video.status, 'pending');
      expect(video.progressPercent, 0);
    });

    test('Video.fromJson uses source_title as fallback', () {
      final json = {
        'id': '789',
        'source_title': 'Fallback Title',
      };

      final video = Video.fromJson(json);
      expect(video.title, 'Fallback Title');
    });
  });

  group('CreateVideoRequest Tests', () {
    test('CreateVideoRequest.toJson includes all fields', () {
      final request = CreateVideoRequest(
        sourceUrl: 'https://youtube.com/shorts/test',
        voiceId: 'Nilar',
        language: 'my',
        aspectRatio: '9:16',
        copyrightOptions: {'color_adjust': true},
        subtitleOptions: {'enabled': true},
      );

      final json = request.toJson();

      expect(json['source_url'], 'https://youtube.com/shorts/test');
      expect(json['voice_id'], 'Nilar');
      expect(json['language'], 'my');
      expect(json['aspect_ratio'], '9:16');
      expect(json['copyright_options'], {'color_adjust': true});
      expect(json['subtitle_options'], {'enabled': true});
    });

    test('CreateVideoRequest.toJson excludes null optionals', () {
      final request = CreateVideoRequest(
        sourceUrl: 'https://youtube.com/shorts/test',
        voiceId: 'Thiha',
        language: 'en',
        aspectRatio: '16:9',
      );

      final json = request.toJson();

      expect(json.containsKey('logo_options'), false);
      expect(json.containsKey('outro_options'), false);
    });
  });
}
