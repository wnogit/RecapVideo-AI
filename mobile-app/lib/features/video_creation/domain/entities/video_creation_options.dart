/// Video Creation Options - Domain Entity
class VideoCreationOptions {
  final String sourceUrl;
  final String voiceId;
  final String language;
  final String aspectRatio;
  final CopyrightOptions copyrightOptions;
  final SubtitleOptions subtitleOptions;
  final LogoOptions logoOptions;
  final OutroOptions outroOptions;
  final List<BlurRegion> blurRegions;
  final int blurIntensity; // 5-30

  const VideoCreationOptions({
    this.sourceUrl = '',
    this.voiceId = 'my-MM-NilarNeural',  // Full Azure TTS format
    this.language = 'my',
    this.aspectRatio = '9:16',
    this.copyrightOptions = const CopyrightOptions(),
    this.subtitleOptions = const SubtitleOptions(),
    this.logoOptions = const LogoOptions(),
    this.outroOptions = const OutroOptions(),
    this.blurRegions = const [],
    this.blurIntensity = 15,
  });

  VideoCreationOptions copyWith({
    String? sourceUrl,
    String? voiceId,
    String? language,
    String? aspectRatio,
    CopyrightOptions? copyrightOptions,
    SubtitleOptions? subtitleOptions,
    LogoOptions? logoOptions,
    OutroOptions? outroOptions,
    List<BlurRegion>? blurRegions,
    int? blurIntensity,
  }) {
    return VideoCreationOptions(
      sourceUrl: sourceUrl ?? this.sourceUrl,
      voiceId: voiceId ?? this.voiceId,
      language: language ?? this.language,
      aspectRatio: aspectRatio ?? this.aspectRatio,
      copyrightOptions: copyrightOptions ?? this.copyrightOptions,
      subtitleOptions: subtitleOptions ?? this.subtitleOptions,
      logoOptions: logoOptions ?? this.logoOptions,
      outroOptions: outroOptions ?? this.outroOptions,
      blurRegions: blurRegions ?? this.blurRegions,
      blurIntensity: blurIntensity ?? this.blurIntensity,
    );
  }

  /// Extract YouTube video ID from URL
  String? get youtubeVideoId {
    final patterns = [
      RegExp(r'youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})'),
      RegExp(r'youtube\.com/shorts/([a-zA-Z0-9_-]{11})'),
      RegExp(r'youtu\.be/([a-zA-Z0-9_-]{11})'),
    ];
    for (final pattern in patterns) {
      final match = pattern.firstMatch(sourceUrl);
      if (match != null) return match.group(1);
    }
    return null;
  }

  /// Get YouTube thumbnail URL
  String? get thumbnailUrl {
    final id = youtubeVideoId;
    return id != null ? 'https://i.ytimg.com/vi/$id/oar2.jpg' : null;
  }
}

class CopyrightOptions {
  final bool colorAdjust;
  final bool horizontalFlip;
  final bool slightZoom;
  final bool audioPitchShift;
  final double pitchValue;

  const CopyrightOptions({
    this.colorAdjust = false,
    this.horizontalFlip = false,
    this.slightZoom = false,
    this.audioPitchShift = false,
    this.pitchValue = 1.0,
  });

  CopyrightOptions copyWith({
    bool? colorAdjust,
    bool? horizontalFlip,
    bool? slightZoom,
    bool? audioPitchShift,
    double? pitchValue,
  }) {
    return CopyrightOptions(
      colorAdjust: colorAdjust ?? this.colorAdjust,
      horizontalFlip: horizontalFlip ?? this.horizontalFlip,
      slightZoom: slightZoom ?? this.slightZoom,
      audioPitchShift: audioPitchShift ?? this.audioPitchShift,
      pitchValue: pitchValue ?? this.pitchValue,
    );
  }
}

class SubtitleOptions {
  final bool enabled;
  final String position; // top, center, bottom
  final String size; // small, medium, large
  final String background; // none, semi, solid
  final String color;
  final bool wordHighlight;  // Highlight current word in subtitle

  const SubtitleOptions({
    this.enabled = true,
    this.position = 'bottom',
    this.size = 'large',  // Changed from 'medium' to match web
    this.background = 'semi',
    this.color = '#FFFFFF',
    this.wordHighlight = true,  // Match web default
  });

  SubtitleOptions copyWith({
    bool? enabled,
    String? position,
    String? size,
    String? background,
    String? color,
    bool? wordHighlight,
  }) {
    return SubtitleOptions(
      enabled: enabled ?? this.enabled,
      position: position ?? this.position,
      size: size ?? this.size,
      background: background ?? this.background,
      color: color ?? this.color,
      wordHighlight: wordHighlight ?? this.wordHighlight,
    );
  }
}

class LogoOptions {
  final bool enabled;
  final String? imageUrl;
  final String? localFilePath; // New: Path specifically for upload
  final String position; // top-left, top-right, bottom-left, bottom-right
  final String size; // small, medium, large
  final int opacity;

  const LogoOptions({
    this.enabled = false,
    this.imageUrl,
    this.localFilePath,
    this.position = 'top-right',
    this.size = 'medium',
    this.opacity = 70,
  });

  LogoOptions copyWith({
    bool? enabled,
    String? imageUrl,
    String? localFilePath,
    String? position,
    String? size,
    int? opacity,
  }) {
    return LogoOptions(
      enabled: enabled ?? this.enabled,
      imageUrl: imageUrl ?? this.imageUrl,
      localFilePath: localFilePath ?? this.localFilePath,
      position: position ?? this.position,
      size: size ?? this.size,
      opacity: opacity ?? this.opacity,
    );
  }
}

class OutroOptions {
  final bool enabled;
  final String platform; // youtube, tiktok, facebook, instagram
  final String channelName;
  final int durationSeconds;
  final bool useLogo;  // Use uploaded logo in outro

  const OutroOptions({
    this.enabled = false,
    this.platform = 'youtube',
    this.channelName = '',
    this.durationSeconds = 5,
    this.useLogo = false,
  });

  OutroOptions copyWith({
    bool? enabled,
    String? platform,
    String? channelName,
    int? durationSeconds,
    bool? useLogo,
  }) {
    return OutroOptions(
      enabled: enabled ?? this.enabled,
      platform: platform ?? this.platform,
      channelName: channelName ?? this.channelName,
      durationSeconds: durationSeconds ?? this.durationSeconds,
      useLogo: useLogo ?? this.useLogo,
    );
  }
}

class BlurRegion {
  final String id;
  final double x;
  final double y;
  final double width;
  final double height;

  const BlurRegion({
    required this.id,
    this.x = 10,
    this.y = 10,
    this.width = 20,
    this.height = 10,
  });

  BlurRegion copyWith({
    double? x,
    double? y,
    double? width,
    double? height,
  }) {
    return BlurRegion(
      id: id,
      x: x ?? this.x,
      y: y ?? this.y,
      width: width ?? this.width,
      height: height ?? this.height,
    );
  }
}
