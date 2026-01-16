import 'package:flutter_test/flutter_test.dart';
import 'package:recapvideo_mobile/features/video_creation/domain/entities/video_creation_options.dart';

void main() {
  group('VideoCreationOptions Tests', () {
    test('Default options have correct values', () {
      const options = VideoCreationOptions();

      expect(options.sourceUrl, '');
      expect(options.voiceId, 'Nilar');
      expect(options.language, 'my');
      expect(options.aspectRatio, '9:16');
      expect(options.blurRegions, isEmpty);
    });

    test('YouTube video ID extraction works for shorts', () {
      const options = VideoCreationOptions(
        sourceUrl: 'https://www.youtube.com/shorts/abc123def45',
      );

      expect(options.youtubeVideoId, 'abc123def45');
    });

    test('YouTube video ID extraction works for watch URLs', () {
      const options = VideoCreationOptions(
        sourceUrl: 'https://www.youtube.com/watch?v=xyz789abc12',
      );

      expect(options.youtubeVideoId, 'xyz789abc12');
    });

    test('YouTube video ID extraction works for youtu.be', () {
      const options = VideoCreationOptions(
        sourceUrl: 'https://youtu.be/short123abc',
      );

      expect(options.youtubeVideoId, 'short123abc');
    });

    test('Invalid URL returns null video ID', () {
      const options = VideoCreationOptions(
        sourceUrl: 'not-a-valid-url',
      );

      expect(options.youtubeVideoId, isNull);
    });
  });

  group('CopyrightOptions Tests', () {
    test('Default copyright options are all false', () {
      const options = CopyrightOptions();

      expect(options.colorAdjust, false);
      expect(options.horizontalFlip, false);
      expect(options.slightZoom, false);
      expect(options.audioPitchShift, false);
      expect(options.pitchValue, 1.0);
    });

    test('CopyWith preserves unchanged values', () {
      const original = CopyrightOptions(colorAdjust: true);
      final copied = original.copyWith(horizontalFlip: true);

      expect(copied.colorAdjust, true);
      expect(copied.horizontalFlip, true);
    });
  });

  group('SubtitleOptions Tests', () {
    test('Default subtitle options', () {
      const options = SubtitleOptions();

      expect(options.enabled, true);
      expect(options.position, 'bottom');
      expect(options.size, 'medium');
    });

    test('Subtitle positions are valid', () {
      const validPositions = ['top', 'center', 'bottom'];
      
      for (final pos in validPositions) {
        final options = SubtitleOptions(position: pos);
        expect(options.position, pos);
      }
    });
  });

  group('LogoOptions Tests', () {
    test('Logo disabled by default', () {
      const options = LogoOptions();

      expect(options.enabled, false);
      expect(options.position, 'top-right');
      expect(options.opacity, 70); // int, not double
    });

    test('Logo positions are valid', () {
      const validPositions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
      
      for (final pos in validPositions) {
        final options = LogoOptions(position: pos);
        expect(options.position, pos);
      }
    });
  });

  group('OutroOptions Tests', () {
    test('Outro disabled by default', () {
      const options = OutroOptions();

      expect(options.enabled, false);
      expect(options.platform, 'youtube');
      expect(options.durationSeconds, 5);
    });

    test('Platform options are valid', () {
      const validPlatforms = ['youtube', 'tiktok', 'facebook', 'instagram'];
      
      for (final platform in validPlatforms) {
        final options = OutroOptions(platform: platform);
        expect(options.platform, platform);
      }
    });
  });

  group('BlurRegion Tests', () {
    test('BlurRegion has correct defaults', () {
      final region = BlurRegion(id: 'test_id');

      expect(region.id, 'test_id');
      expect(region.x, 10.0);
      expect(region.y, 10.0);
      expect(region.width, 20.0);
      expect(region.height, 10.0);
    });

    test('BlurRegion copyWith works correctly', () {
      final original = BlurRegion(id: 'r1', x: 0.1, y: 0.2);
      final copied = original.copyWith(width: 0.5);

      expect(copied.id, 'r1');
      expect(copied.x, 0.1);
      expect(copied.y, 0.2);
      expect(copied.width, 0.5);
    });
  });
}
