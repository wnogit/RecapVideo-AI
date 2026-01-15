# RecapVideo.AI Bundled Fonts

This directory contains fonts bundled with the application for consistent rendering across all deployment environments.

## Required Fonts

For Burmese (Myanmar) language support, download and place these fonts here:

1. **NotoSansMyanmar-Regular.ttf** (Recommended)
   - Download: https://fonts.google.com/noto/specimen/Noto+Sans+Myanmar
   - Best Unicode support for Myanmar script

2. **Pyidaungsu-Regular.ttf** (Alternative)
   - Download: https://github.com/nicmakesawebpage/pyidaungsu
   - Official Myanmar government font

3. **DejaVuSans.ttf** (Fallback)
   - Download: https://dejavu-fonts.github.io/
   - Good Unicode support but limited Myanmar glyphs

## Installation

### Manual Download
```bash
# Download Noto Sans Myanmar
curl -L "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansMyanmar/NotoSansMyanmar-Regular.ttf" -o NotoSansMyanmar-Regular.ttf

# Download DejaVuSans
curl -L "https://github.com/dejavu-fonts/dejavu-fonts/releases/download/version_2_37/dejavu-fonts-ttf-2.37.tar.bz2" | tar -xjf - --wildcards "*/DejaVuSans.ttf" --strip-components=2
```

### Docker
Fonts in this directory are automatically included in Docker builds.

## Font Priority

The video processing service looks for fonts in this order:
1. Bundled fonts (this directory)
2. Linux system fonts
3. Windows system fonts
4. macOS system fonts

## Notes

- Ensure fonts support Unicode for proper Myanmar script rendering
- TTF format is preferred over OTF for FFmpeg compatibility
- File names are case-sensitive on Linux
