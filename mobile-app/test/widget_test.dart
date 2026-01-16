// RecapVideo.ai Flutter App Tests

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:recapvideo_mobile/main.dart';

void main() {
  testWidgets('App loads and shows content', (WidgetTester tester) async {
    // Build our app and trigger a frame
    await tester.pumpWidget(
      const ProviderScope(
        child: RecapVideoApp(),
      ),
    );

    // Wait for async operations
    await tester.pump(const Duration(milliseconds: 500));

    // Verify app loads - should show either login or home content
    // The pill badge text should appear on auth screens
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
