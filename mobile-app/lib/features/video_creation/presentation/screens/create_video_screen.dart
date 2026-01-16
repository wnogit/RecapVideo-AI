import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
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

  static const List<_StepInfo> _steps = [
    _StepInfo(id: 1, name: 'Input', icon: '🎬'),
    _StepInfo(id: 2, name: 'Styles', icon: '🎨'),
    _StepInfo(id: 3, name: 'Branding', icon: '✨'),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(videoCreationProvider);
    final currentStep = state.currentStep;
    
    // Show Processing View
    if (state.isProcessing) {
      return Scaffold(
        backgroundColor: AppColors.background,
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
        backgroundColor: AppColors.background,
        body: SafeArea(
          child: CompleteViewWidget(
            title: state.completedVideoTitle ?? 'Video Created',
            duration: '~2:30',
            appliedFeatures: _getAppliedFeatures(state.options),
            onCreateAnother: () => ref.read(videoCreationProvider.notifier).resetAfterComplete(),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
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
                        'Video ဖန်တီးမည်',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: Colors.white,
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
                        icon: const Icon(Icons.close, color: Colors.white54, size: 22),
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
                      for (int i = 0; i < _steps.length; i++) ...[
                        _buildStepPill(
                          context,
                          ref,
                          step: _steps[i],
                          isActive: currentStep == _steps[i].id,
                          isCompleted: currentStep > _steps[i].id,
                        ),
                        if (i < _steps.length - 1)
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: Icon(
                              Icons.chevron_right,
                              size: 16,
                              color: currentStep > _steps[i].id 
                                  ? AppColors.primary 
                                  : Colors.white30,
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
                color: AppColors.background,
                border: Border(
                  top: BorderSide(color: const Color(0xFF3a3a4a).withAlpha(80)),
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
                            side: const BorderSide(color: Color(0xFF3a3a4a)),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: const [
                              Icon(Icons.chevron_left, color: Colors.white70, size: 20),
                              Text('နောက်သို့', style: TextStyle(color: Colors.white70, fontSize: 13)),
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
                                backgroundColor: AppColors.primary,
                                disabledBackgroundColor: const Color(0xFF3a3a4a),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: const [
                                  Text('ရှေ့ဆက်ရန်', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Colors.white)),
                                  SizedBox(width: 4),
                                  Icon(Icons.chevron_right, size: 18, color: Colors.white),
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
                                        children: const [
                                          Icon(Icons.auto_awesome, size: 16, color: Colors.white),
                                          SizedBox(width: 6),
                                          Text(
                                            'Video ဖန်တီးမည်',
                                            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Colors.white),
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
              ? AppColors.primary
              : isCompleted
                  ? AppColors.primary.withAlpha(40)
                  : const Color(0xFF2a2a3a),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isActive || isCompleted ? AppColors.primary : Colors.transparent,
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
                        ? AppColors.primary
                        : Colors.white.withAlpha(20),
              ),
              child: Center(
                child: isCompleted
                    ? const Icon(Icons.check, size: 8, color: Colors.white)
                    : Text(
                        '${step.id}',
                        style: TextStyle(
                          fontSize: 8,
                          fontWeight: FontWeight.bold,
                          color: isActive ? Colors.white : Colors.white60,
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
                color: isActive ? Colors.white : Colors.white60,
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
