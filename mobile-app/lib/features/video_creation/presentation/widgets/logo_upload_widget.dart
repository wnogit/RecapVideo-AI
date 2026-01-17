import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../../../core/theme/app_colors.dart';

/// Logo upload state
class LogoUploadState {
  final File? file;
  final String? uploadedUrl;
  final bool isUploading;
  final String? error;

  const LogoUploadState({this.file, this.uploadedUrl, this.isUploading = false, this.error});

  LogoUploadState copyWith({File? file, String? uploadedUrl, bool? isUploading, String? error}) {
    return LogoUploadState(
      file: file ?? this.file,
      uploadedUrl: uploadedUrl ?? this.uploadedUrl,
      isUploading: isUploading ?? this.isUploading,
      error: error,
    );
  }
}

/// Logo upload notifier
class LogoUploadNotifier extends StateNotifier<LogoUploadState> {
  final ImagePicker _picker = ImagePicker();

  LogoUploadNotifier() : super(const LogoUploadState());

  Future<void> pickLogo({bool fromCamera = false}) async {
    try {
      final XFile? image = await _picker.pickImage(
        source: fromCamera ? ImageSource.camera : ImageSource.gallery,
        maxWidth: 512,
        maxHeight: 512,
        imageQuality: 90,
      );
      if (image != null) {
        state = state.copyWith(file: File(image.path), error: null);
      }
    } catch (e) {
      state = state.copyWith(error: 'Failed to pick image: $e');
    }
  }

  void clear() {
    state = const LogoUploadState();
  }

  // TODO: Connect to uploads API
  Future<String?> uploadLogo() async {
    if (state.file == null) return null;

    state = state.copyWith(isUploading: true, error: null);
    try {
      // Simulate upload - replace with actual API call
      await Future.delayed(const Duration(seconds: 1));
      // final url = await uploadsService.upload(state.file!);
      const url = 'https://example.com/logo.png';
      state = state.copyWith(uploadedUrl: url, isUploading: false);
      return url;
    } catch (e) {
      state = state.copyWith(error: e.toString(), isUploading: false);
      return null;
    }
  }
}

/// Provider
final logoUploadProvider = StateNotifierProvider<LogoUploadNotifier, LogoUploadState>((ref) {
  return LogoUploadNotifier();
});

/// Logo Upload Widget
class LogoUploadWidget extends ConsumerWidget {
  const LogoUploadWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(logoUploadProvider);
    final notifier = ref.read(logoUploadProvider.notifier);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'သင့် Logo ထည့်ရန်',
          style: TextStyle(color: Colors.white70, fontSize: 12),
        ),
        const SizedBox(height: 12),

        // Upload area
        if (state.file != null)
          _buildPreview(context, state.file!, notifier)
        else
          _buildUploadButtons(notifier),

        // Error
        if (state.error != null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(state.error!, style: const TextStyle(color: Colors.red, fontSize: 11)),
          ),

        // Uploading indicator
        if (state.isUploading)
          const Padding(
            padding: EdgeInsets.only(top: 8),
            child: LinearProgressIndicator(color: AppColors.primary),
          ),
      ],
    );
  }

  Widget _buildUploadButtons(LogoUploadNotifier notifier) {
    return Row(
      children: [
        Expanded(
          child: _UploadButton(
            icon: Icons.photo_library_outlined,
            label: 'Gallery',
            onTap: () => notifier.pickLogo(fromCamera: false),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _UploadButton(
            icon: Icons.camera_alt_outlined,
            label: 'Camera',
            onTap: () => notifier.pickLogo(fromCamera: true),
          ),
        ),
      ],
    );
  }

  Widget _buildPreview(BuildContext context, File file, LogoUploadNotifier notifier) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF1a1a2e),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.green.withAlpha(100)),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.file(file, width: 60, height: 60, fit: BoxFit.cover),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Logo Selected ✓',
                  style: TextStyle(color: Colors.green, fontWeight: FontWeight.w500, fontSize: 13),
                ),
                const SizedBox(height: 4),
                Text(
                  file.path.split('/').last,
                  style: const TextStyle(color: Colors.grey, fontSize: 11),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () => notifier.clear(),
            icon: const Icon(Icons.close, color: Colors.red, size: 20),
          ),
        ],
      ),
    );
  }
}

/// Upload Button
class _UploadButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _UploadButton({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 24),
        decoration: BoxDecoration(
          color: const Color(0xFF1a1a2e),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFF3a3a4a)),
        ),
        child: Column(
          children: [
            Icon(icon, color: AppColors.primary, size: 28),
            const SizedBox(height: 8),
            Text(label, style: const TextStyle(color: Colors.white70, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}
