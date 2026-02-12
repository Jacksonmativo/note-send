export interface StickerItem {
  id: string;
  label: string;
  emoji: string;
  category: 'hearts' | 'flowers' | 'faces' | 'tape' | 'doodles' | 'stars';
}

export const STICKERS: StickerItem[] = [
  // Hearts
  { id: 'heart-red', label: 'Red Heart', emoji: '❤️', category: 'hearts' },
  { id: 'heart-pink', label: 'Pink Heart', emoji: '💗', category: 'hearts' },
  { id: 'heart-sparkling', label: 'Sparkling Heart', emoji: '💖', category: 'hearts' },
  { id: 'heart-arrow', label: 'Heart Arrow', emoji: '💘', category: 'hearts' },
  { id: 'heart-ribbon', label: 'Heart Ribbon', emoji: '💝', category: 'hearts' },
  { id: 'two-hearts', label: 'Two Hearts', emoji: '💕', category: 'hearts' },

  // Flowers
  { id: 'flower-cherry', label: 'Cherry Blossom', emoji: '🌸', category: 'flowers' },
  { id: 'flower-rose', label: 'Rose', emoji: '🌹', category: 'flowers' },
  { id: 'flower-sunflower', label: 'Sunflower', emoji: '🌻', category: 'flowers' },
  { id: 'flower-tulip', label: 'Tulip', emoji: '🌷', category: 'flowers' },
  { id: 'flower-bouquet', label: 'Bouquet', emoji: '💐', category: 'flowers' },
  { id: 'flower-hibiscus', label: 'Hibiscus', emoji: '🌺', category: 'flowers' },

  // Faces
  { id: 'face-smile', label: 'Smile', emoji: '😊', category: 'faces' },
  { id: 'face-love', label: 'Love Eyes', emoji: '😍', category: 'faces' },
  { id: 'face-kiss', label: 'Kiss', emoji: '😘', category: 'faces' },
  { id: 'face-wink', label: 'Wink', emoji: '😉', category: 'faces' },
  { id: 'face-blush', label: 'Blush', emoji: '🥰', category: 'faces' },
  { id: 'face-hug', label: 'Hug', emoji: '🤗', category: 'faces' },

  // Tape / Deco
  { id: 'tape-pin', label: 'Pin', emoji: '📌', category: 'tape' },
  { id: 'tape-paperclip', label: 'Paperclip', emoji: '📎', category: 'tape' },
  { id: 'tape-pencil', label: 'Pencil', emoji: '✏️', category: 'tape' },
  { id: 'tape-memo', label: 'Memo', emoji: '📝', category: 'tape' },
  { id: 'tape-envelope', label: 'Love Letter', emoji: '💌', category: 'tape' },
  { id: 'tape-ribbon', label: 'Ribbon', emoji: '🎀', category: 'tape' },

  // Stars / Sparkles
  { id: 'star-glow', label: 'Glow Star', emoji: '🌟', category: 'stars' },
  { id: 'star-sparkle', label: 'Sparkles', emoji: '✨', category: 'stars' },
  { id: 'star-dizzy', label: 'Dizzy', emoji: '💫', category: 'stars' },
  { id: 'star-fire', label: 'Fire', emoji: '🔥', category: 'stars' },
  { id: 'star-rainbow', label: 'Rainbow', emoji: '🌈', category: 'stars' },
  { id: 'star-butterfly', label: 'Butterfly', emoji: '🦋', category: 'stars' },
];

export const STICKER_CATEGORIES = [
  { id: 'hearts', label: '❤️ Hearts' },
  { id: 'flowers', label: '🌸 Flowers' },
  { id: 'faces', label: '😊 Faces' },
  { id: 'tape', label: '📌 Deco' },
  { id: 'stars', label: '✨ Stars' },
] as const;

export type InkColor = 'blue' | 'black' | 'red';

export const INK_COLORS: { id: InkColor; label: string; cssVar: string }[] = [
  { id: 'blue', label: 'Blue Ink', cssVar: 'var(--ink-blue)' },
  { id: 'black', label: 'Black Ink', cssVar: 'var(--ink-black)' },
  { id: 'red', label: 'Red Pen', cssVar: 'var(--ink-red)' },
];

export const FONT_OPTIONS = [
  { id: 'Caveat', label: 'Caveat', className: 'font-handwriting' },
  { id: 'Patrick Hand', label: 'Patrick Hand', className: 'font-handwriting-patrick' },
  { id: 'Gloria Hallelujah', label: 'Gloria', className: 'font-handwriting-alt' },
  { id: 'Indie Flower', label: 'Indie', className: 'font-handwriting-indie' },
];
