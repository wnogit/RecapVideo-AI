import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/l10n/app_strings.dart';
import '../../../../core/navigation/main_navigation.dart';
import '../providers/video_creation_provider.dart';
import '../widgets/live_preview_widget.dart';
import '../widgets/step1_input_widget.dart';
import '../widgets/step2_styles_widget.dart';
import '../widgets/step3_branding_widget.dart';
import '../widgets/processing_view_widget.dart';
import '../widgets/complete_view_widget.dart';

/// Create Video Screen - Full page scrollable with compact preview
class CreateVideoScreen extends ConsumerWidget {
  const CreateVideoScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = context.colors;
    final strings = ref.watch(stringsProvider);
    final state = ref.watch(videoCreationProvider);
    final currentStep = state.currentStep;
    
    // Dynamic step info with localization
    final steps = [
      _StepInfo(id: 1, name: strings.isEnglish ? 'Input' : 'ထည့်သွင်း', icon: '🎬'),
      _StepInfo(id: 2, name: strings.isEnglish ? 'Styles' : 'ပုံစံ', icon: '🎨'),
      _StepInfo(id: 3, name: strings.branding, icon: '✨'),
    ];
    
    // Show Processing View
    if (state.isProcessing) {
      return Scaffold(
        backgroundColor: colors.background,
        body: SafeArea(
          child: ProcessingViewWidget(
            progress: state.processingProgress,
            currentStatus: state.processingStatus.name,
            onCancel: () => ref.read(videoCreationProvider.notifier).cancelProcessing(),
          ),
        ),
      );
    }
    
    // Show Complete View
    if (state.isComplete) {
      return Scaffold(
        backgroundColor: colors.background,
        body: SafeArea(
          child: CompleteViewWidget(
            title: state.completedVideoTitle ?? (strings.isEnglish ? 'Video Created' : 'ဖန်တီးပြီးပါပြီ'),
            duration: '~2:30',
            appliedFeatures: _getAppliedFeatures(state.options),
            onCreateAnother: () => ref.read(videoCreationProvider.notifier).resetAfterComplete(),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: colors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Fixed Header with step indicator
            Container(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: Column(
                children: [
                  // Title Row
                  Row(
                    children: [
                      const Text('🎥', style: TextStyle(fontSize: 20)),
                      const SizedBox(width: 8),
                      Text(
                        strings.createVideo,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: colors.textPrimary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const Spacer(),
                      // Close button - go back to Home tab
                      IconButton(
                        onPressed: () {
                          // Navigate back to Home tab (index 0)
                          ref.read(navigationIndexProvider.notifier).state = 0;
                        },
                        icon: Icon(Icons.close, color: colors.textSecondary, size: 22),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Step Pills - Compact
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      for (int i = 0; i < steps.length; i++) ...[
                        _buildStepPill(
                          context,
                          ref,
                          colors: colors,
                          step: steps[i],
                          isActive: currentStep == steps[i].id,
                          isCompleted: currentStep > steps[i].id,
                        ),
                        if (i < steps.length - 1)
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: Icon(
                              Icons.chevron_right,
                              size: 16,
                              color: currentStep > steps[i].id 
                                  ? colors.primary 
                                  : colors.textTertiary,
                            ),
                          ),
                      ],
                    ],
                  ),
                ],
              ),
            ),

            // Scrollable content - Preview + Step Content
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    // Live Preview - Compact
                    const LivePreviewWidget(),


                    // Step Content (no divider)
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 250),
                        child: Container(
                          key: ValueKey(currentStep),
                          child: _buildStepContent(currentStep),
                        ),
                      ),
                    ),

                    // Extra padding for bottom button
                    const SizedBox(height: 80),
                  ],
                ),
              ),
            ),

            // Bottom Navigation Buttons - Fixed
            Container(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              decoration: BoxDecoration(
                color: colors.background,
                border: Border(
                  top: BorderSide(color: colors.border),
                ),
              ),
              child: SafeArea(
                top: false,
                child: Row(
                  children: [
                    // Back Button
                    if (currentStep > 1)
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => ref.read(videoCreationProvider.notifier).prevStep(),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            side: BorderSide(color: colors.border),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.chevron_left, color: colors.textSecondary, size: 20),
                              Text(strings.back, style: TextStyle(color: colors.textSecondary, fontSize: 13)),
                            ],
                          ),
                        ),
                      )
                    else
                      const Expanded(child: SizedBox()),
                    
                    const SizedBox(width: 12),

                    // Next / Submit Button
                    Expanded(
                      flex: 2,
                      child: currentStep < 3
                          ? ElevatedButton(
                              onPressed: state.isStep1Valid || currentStep > 1
                                  ? () => ref.read(videoCreationProvider.notifier).nextStep()
                                  : null,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: colors.primary,
                                disabledBackgroundColor: colors.surfaceVariant,
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(strings.next, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Colors.white)),
                                  const SizedBox(width: 4),
                                  const Icon(Icons.chevron_right, size: 18, color: Colors.white),
                                ],
                              ),
                            )
                          : Container(
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [Color(0xFF8B5CF6), Color(0xFFEC4899)],
                                ),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: ElevatedButton(
                                onPressed: state.canSubmit && !state.isSubmitting
                                    ? () => ref.read(videoCreationProvider.notifier).submit()
                                    : null,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.transparent,
                                  shadowColor: Colors.transparent,
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                ),
                                child: state.isSubmitting
                                    ? const SizedBox(
                                        width: 18,
                                        height: 18,
                                        child: CircularProgressIndicator(
                                          color: Colors.white,
                                          strokeWidth: 2,
                                        ),
                                      )
                                    : Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          const Icon(Icons.auto_awesome, size: 16, color: Colors.white),
                                          const SizedBox(width: 6),
                                          Text(
                                            strings.createVideo,
                                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Colors.white),
                                          ),
                                        ],
                                      ),
                              ),
                            ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStepPill(
    BuildContext context,
    WidgetRef ref, {
    required AppColorsExtension colors,
    required _StepInfo step,
    required bool isActive,
    required bool isCompleted,
  }) {
    return GestureDetector(
      onTap: isCompleted ? () => ref.read(videoCreationProvider.notifier).setStep(step.id) : null,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: isActive
              ? colors.primary
              : isCompleted
                  ? colors.primary.withAlpha(40)
                  : colors.surfaceVariant,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isActive || isCompleted ? colors.primary : Colors.transparent,
            width: isActive ? 1.5 : 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 14,
              height: 14,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isActive
                    ? Colors.white.withAlpha(50)
                    : isCompleted
                        ? colors.primary
                        : colors.textTertiary.withAlpha(40),
              ),
              child: Center(
                child: isCompleted
                    ? const Icon(Icons.check, size: 8, color: Colors.white)
                    : Text(
                        '${step.id}',
                        style: TextStyle(
                          fontSize: 8,
                          fontWeight: FontWeight.bold,
                          color: isActive ? Colors.white : colors.textSecondary,
                        ),
                      ),
              ),
            ),
            const SizedBox(width: 4),
            Text(
              step.name,
              style: TextStyle(
                fontSize: 10,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
                color: isActive ? Colors.white : colors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStepContent(int step) {
    switch (step) {
      case 1:
        return const Step1InputWidget();
      case 2:
        return const Step2StylesWidget();
      case 3:
        return const Step3BrandingWidget();
      default:
        return const Step1InputWidget();
    }
  }
  
  /// Get list of applied features for Complete View
  List<String> _getAppliedFeatures(dynamic options) {
    final features = <String>[];
    if (options.subtitleOptions.enabled) features.add('Subtitles enabled');
    if (options.logoOptions.enabled) features.add('Logo added');
    if (options.outroOptions.enabled) features.add('Outro added');
    if (options.copyrightOptions.colorAdjust) features.add('Color adjustment');
    if (options.copyrightOptions.horizontalFlip) features.add('Horizontal flip');
    if (options.copyrightOptions.audioPitchShift) features.add('Audio pitch shift');
    if (options.copyrightOptions.slightZoom) features.add('Slight zoom');
    if (options.blurRegions.isNotEmpty) features.add('Blur regions (${options.blurRegions.length})');
    return features;
  }
}

class _StepInfo {
  final int id;
  final String name;
  final String icon;

  const _StepInfo({required this.id, required this.name, required this.icon});
}
