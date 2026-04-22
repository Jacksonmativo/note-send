export interface StickerItem {
  id: string;
  label: string;
  emoji?: string;
  image?: string;
  category: 'hearts' | 'flowers' | 'faces' | 'tape' | 'doodles' | 'stars' | 'food' | 'animals' | 'weather' | 'travel' | 'cutout';
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

  // Food & Drinks
  { id: 'food-coffee', label: 'Coffee', emoji: '☕', category: 'food' },
  { id: 'food-cake', label: 'Cake', emoji: '🍰', category: 'food' },
  { id: 'food-donut', label: 'Donut', emoji: '🍩', category: 'food' },
  { id: 'food-cookie', label: 'Cookie', emoji: '🍪', category: 'food' },
  { id: 'food-icecream', label: 'Ice Cream', emoji: '🍦', category: 'food' },
  { id: 'food-cupcake', label: 'Cupcake', emoji: '🧁', category: 'food' },
  { id: 'food-chocolate', label: 'Chocolate', emoji: '🍫', category: 'food' },
  { id: 'food-strawberry', label: 'Strawberry', emoji: '🍓', category: 'food' },
  { id: 'food-cherry', label: 'Cherries', emoji: '🍒', category: 'food' },
  { id: 'food-wine', label: 'Wine', emoji: '🍷', category: 'food' },
  { id: 'food-bubble-tea', label: 'Bubble Tea', emoji: '🧋', category: 'food' },
  { id: 'food-pizza', label: 'Pizza', emoji: '🍕', category: 'food' },

  // Animals
  { id: 'animal-cat', label: 'Cat', emoji: '🐱', category: 'animals' },
  { id: 'animal-dog', label: 'Dog', emoji: '🐶', category: 'animals' },
  { id: 'animal-bunny', label: 'Bunny', emoji: '🐰', category: 'animals' },
  { id: 'animal-bear', label: 'Bear', emoji: '🐻', category: 'animals' },
  { id: 'animal-panda', label: 'Panda', emoji: '🐼', category: 'animals' },
  { id: 'animal-fox', label: 'Fox', emoji: '🦊', category: 'animals' },
  { id: 'animal-unicorn', label: 'Unicorn', emoji: '🦄', category: 'animals' },
  { id: 'animal-dove', label: 'Dove', emoji: '🕊️', category: 'animals' },
  { id: 'animal-ladybug', label: 'Ladybug', emoji: '🐞', category: 'animals' },
  { id: 'animal-bee', label: 'Bee', emoji: '🐝', category: 'animals' },
  { id: 'animal-whale', label: 'Whale', emoji: '🐳', category: 'animals' },
  { id: 'animal-chick', label: 'Chick', emoji: '🐥', category: 'animals' },

  // Weather & Nature
  { id: 'weather-sun', label: 'Sun', emoji: '☀️', category: 'weather' },
  { id: 'weather-moon', label: 'Moon', emoji: '🌙', category: 'weather' },
  { id: 'weather-cloud', label: 'Cloud', emoji: '☁️', category: 'weather' },
  { id: 'weather-snowflake', label: 'Snowflake', emoji: '❄️', category: 'weather' },
  { id: 'weather-raindrop', label: 'Raindrop', emoji: '💧', category: 'weather' },
  { id: 'weather-thunder', label: 'Thunder', emoji: '⚡', category: 'weather' },
  { id: 'weather-leaf', label: 'Leaf', emoji: '🍃', category: 'weather' },
  { id: 'weather-maple', label: 'Maple', emoji: '🍁', category: 'weather' },
  { id: 'weather-clover', label: 'Clover', emoji: '🍀', category: 'weather' },
  { id: 'weather-mushroom', label: 'Mushroom', emoji: '🍄', category: 'weather' },
  { id: 'weather-star-night', label: 'Night Sky', emoji: '🌃', category: 'weather' },
  { id: 'weather-sunset', label: 'Sunset', emoji: '🌅', category: 'weather' },

  // Travel & Objects
  { id: 'travel-camera', label: 'Camera', emoji: '📷', category: 'travel' },
  { id: 'travel-plane', label: 'Plane', emoji: '✈️', category: 'travel' },
  { id: 'travel-globe', label: 'Globe', emoji: '🌍', category: 'travel' },
  { id: 'travel-compass', label: 'Compass', emoji: '🧭', category: 'travel' },
  { id: 'travel-tent', label: 'Tent', emoji: '⛺', category: 'travel' },
  { id: 'travel-mountain', label: 'Mountain', emoji: '🏔️', category: 'travel' },
  { id: 'travel-palm', label: 'Palm Tree', emoji: '🌴', category: 'travel' },
  { id: 'travel-shell', label: 'Shell', emoji: '🐚', category: 'travel' },
  { id: 'travel-balloon', label: 'Balloon', emoji: '🎈', category: 'travel' },
  { id: 'travel-gift', label: 'Gift', emoji: '🎁', category: 'travel' },
  { id: 'travel-key', label: 'Key', emoji: '🔑', category: 'travel' },
  { id: 'travel-gem', label: 'Gem', emoji: '💎', category: 'travel' },

  // Cutout Stickers
  { id: 'cutout-bonjour', label: 'Bonjour', image: '/cutout-stickers/_Bonjour__ Sticker for Sale by perzy in 2024 _ Black and white stickers, French icons, Bonjour.png', category: 'cutout' },
  { id: 'cutout-coquette', label: 'Coquette Bunny', image: '/cutout-stickers/🎀coquette bunny🎀.png', category: 'cutout' },
  { id: 'cutout-adesivos', label: 'Adesivos', image: '/cutout-stickers/adesivos.png', category: 'cutout' },
  { id: 'cutout-pie', label: 'Adorable Pie', image: '/cutout-stickers/Adorable Pie Decal _ Adorable Pie.png', category: 'cutout' },
  { id: 'cutout-capture', label: 'Capture', image: '/cutout-stickers/Capture.png', category: 'cutout' },
  { id: 'cutout-plane', label: 'Paper Plane', image: '/cutout-stickers/Cartoon Hand Painted Paper Plane, Car Drawing, Cartoon Drawing, Plane Drawing PNG Transparent Clipart Image and PSD File for Free Download.png', category: 'cutout' },
  { id: 'cutout-love-quote', label: 'Love Quote', image: '/cutout-stickers/Cute Love Quote Stickers for Him and Special Occasions.png', category: 'cutout' },
  { id: 'cutout-hydro', label: 'Hydro Flask', image: '/cutout-stickers/Hydro Flask Stickers _ Redbubble.png', category: 'cutout' },
  { id: 'cutout-i-love-you', label: 'I Love You', image: '/cutout-stickers/I love you ❤️.png', category: 'cutout' },
  { id: 'cutout-introversion', label: 'Introversion', image: '/cutout-stickers/Introversion_ Unique Perspectives.png', category: 'cutout' },
  { id: 'cutout-music', label: 'Music Stickers', image: '/cutout-stickers/Music Stickers for Sale.png', category: 'cutout' },
  { id: 'cutout-peach', label: 'Peach Goma', image: '/cutout-stickers/Peach Goma Biting Sticker _ Peach-goma.png', category: 'cutout' },
  { id: 'cutout-preppy', label: 'Preppy Stickers', image: '/cutout-stickers/Pin by Whitney Angeles on Stickers _ Preppy stickers, Sticker design inspiration, Girl stickers.png', category: 'cutout' },
  { id: 'cutout-butterfly', label: 'Butterfly', image: '/cutout-stickers/Pink Transparent Bubble Butterfly Effect Element Png And Psd  C43.png', category: 'cutout' },
  { id: 'cutout-generic', label: 'Generic', image: '/cutout-stickers/Png.png', category: 'cutout' },
  { id: 'cutout-shawn', label: 'Shawn Mendes', image: '/cutout-stickers/Shawn Mendes Stickers for Sale.png', category: 'cutout' },
  { id: 'cutout-stickers', label: 'Stickers Pack', image: '/cutout-stickers/Stickers for Sale.png', category: 'cutout' },
  { id: 'cutout-unique', label: 'Unique Decals', image: '/cutout-stickers/Unique Decal Creations.png', category: 'cutout' },
  { id: 'cutout-beautiful', label: 'Beautiful', image: '/cutout-stickers/You Are Beautiful Sticker.png', category: 'cutout' },
  { id: 'cutout-girl', label: 'Just a Girl', image: '/cutout-stickers/i am jus t a girl!!!!!.png', category: 'cutout' },
];

export const STICKER_CATEGORIES = [
  { id: 'cutout', label: '🖼️ Cutout stikers', isMain: true },
  { id: 'emoji', label: '😊 Emojis', isMain: true },

] as const;

export const EMOJI_SUBCATEGORIES = [
  { id: 'hearts', label: '❤️ Hearts' },
  { id: 'flowers', label: '🌸 Flowers' },
  { id: 'faces', label: '😊 Faces' },
  { id: 'food', label: '☕ Food' },
  { id: 'animals', label: '🐱 Animals' },
  { id: 'weather', label: '☀️ Nature' },
  { id: 'travel', label: '✈️ Travel' },
  { id: 'tape', label: '📌 Deco' },
  { id: 'stars', label: '✨ Stars' },
] as const;

export type InkColor = 'blue' | 'black' | 'red' | 'green';

export const INK_COLORS: { id: InkColor; label: string; cssVar: string }[] = [
  { id: 'blue', label: 'Blue Ink', cssVar: 'var(--ink-blue)' },
  { id: 'black', label: 'Black Ink', cssVar: 'var(--ink-black)' },
  { id: 'red', label: 'Red Pen', cssVar: 'var(--ink-red)' },
  { id: 'green', label: 'Green Pen', cssVar: 'var(--ink-green)' },
];

export const FONT_OPTIONS = [
  { id: 'Caveat', label: 'Caveat', className: 'font-handwriting' },
  { id: 'Patrick Hand', label: 'Patrick Hand', className: 'font-handwriting-patrick' },
  { id: 'Gloria Hallelujah', label: 'Gloria', className: 'font-handwriting-alt' },
  { id: 'Indie Flower', label: 'Indie', className: 'font-handwriting-indie' },
  { id: 'Dancing Script', label: 'Dancing', className: 'font-handwriting-dancing' },
];
