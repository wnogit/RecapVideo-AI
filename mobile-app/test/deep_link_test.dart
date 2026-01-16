import 'package:flutter_test/flutter_test.dart';
import 'package:recapvideo_mobile/core/router/app_router.dart';

void main() {
  group('DeepLinkConfig Tests', () {
    test('scheme is correct', () {
      expect(DeepLinkConfig.scheme, 'recapvideo');
    });

    test('webHost is correct', () {
      expect(DeepLinkConfig.webHost, 'recapvideo.ai');
    });

    test('paths are defined', () {
      expect(DeepLinkConfig.videoPath, '/video/:id');
      expect(DeepLinkConfig.orderPath, '/order/:id');
      expect(DeepLinkConfig.createPath, '/create');
      expect(DeepLinkConfig.creditsPath, '/credits');
    });
  });

  group('DeepLinkHelper Tests', () {
    test('videoLink generates correct URL', () {
      final link = DeepLinkHelper.videoLink('video123');
      expect(link, 'recapvideo://video/video123');
    });

    test('orderLink generates correct URL', () {
      final link = DeepLinkHelper.orderLink('order456');
      expect(link, 'recapvideo://order/order456');
    });

    test('createLink without source URL', () {
      final link = DeepLinkHelper.createLink();
      expect(link, 'recapvideo://create');
    });

    test('createLink with source URL is properly encoded', () {
      final link = DeepLinkHelper.createLink(
        sourceUrl: 'https://youtube.com/shorts/abc?param=1',
      );
      expect(link.startsWith('recapvideo://create?url='), true);
      expect(link.contains('youtube.com'), true);
    });

    test('universalVideoLink generates web URL', () {
      final link = DeepLinkHelper.universalVideoLink('vid789');
      expect(link, 'https://recapvideo.ai/video/vid789');
    });
  });
}
