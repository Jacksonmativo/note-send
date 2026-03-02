// Photo frames, CSS filters, and overlay effects for image stickers

export interface PhotoFrame {
  id: string;
  label: string;
  emoji: string;
}

export interface PhotoFilter {
  id: string;
  label: string;
  css: string;
}

export interface PhotoEffect {
  id: string;
  label: string;
  emoji: string;
}

export const PHOTO_FRAMES: PhotoFrame[] = [
  { id: 'none', label: 'None', emoji: '✖️' },
  { id: 'polaroid', label: 'Polaroid', emoji: '📸' },
  { id: 'tape-corners', label: 'Tape Corners', emoji: '📋' },
  { id: 'retro-border', label: 'Retro Border', emoji: '🖼️' },
  { id: 'scrapbook', label: 'Scrapbook', emoji: '📔' },
  { id: 'stamp', label: 'Stamp', emoji: '📮' },
  { id: 'torn-edge', label: 'Torn Edge', emoji: '📄' },
];

export const PHOTO_FILTERS: PhotoFilter[] = [
  { id: 'none', label: 'None', css: 'none' },
  { id: 'sepia', label: 'Sepia', css: 'sepia(0.8) saturate(1.2)' },
  { id: 'grayscale', label: 'B&W', css: 'grayscale(1) contrast(1.1)' },
  { id: 'vintage', label: 'Vintage', css: 'sepia(0.4) contrast(1.1) brightness(0.95) saturate(0.8)' },
  { id: 'warm', label: 'Warm', css: 'sepia(0.2) saturate(1.4) brightness(1.05)' },
  { id: 'cool', label: 'Cool', css: 'saturate(0.8) brightness(1.05) hue-rotate(15deg)' },
  { id: 'blur', label: 'Dreamy', css: 'blur(0.5px) brightness(1.1) saturate(1.2)' },
  { id: 'high-contrast', label: 'Pop', css: 'contrast(1.4) saturate(1.3)' },
  { id: 'faded', label: 'Faded', css: 'contrast(0.85) brightness(1.1) saturate(0.7)' },
];

export const PHOTO_EFFECTS: PhotoEffect[] = [
  { id: 'none', label: 'None', emoji: '✖️' },
  { id: 'vhs', label: 'VHS', emoji: '📼' },
  { id: 'crt', label: 'CRT', emoji: '📺' },
  { id: 'grain', label: 'Grain', emoji: '🌾' },
  { id: 'glitch', label: 'Glitch', emoji: '⚡' },
  { id: 'sparkle', label: 'Sparkle', emoji: '✨' },
  { id: 'noise', label: 'Noise', emoji: '📡' },
];
