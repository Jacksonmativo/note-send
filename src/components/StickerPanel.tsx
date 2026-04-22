import { useState } from 'react';
import { STICKERS, STICKER_CATEGORIES, EMOJI_SUBCATEGORIES, type StickerItem } from './StickerData';
import { motion, AnimatePresence } from 'framer-motion';

interface StickerPanelProps {
  onAddSticker: (sticker: StickerItem) => void;
}

const StickerPanel = ({ onAddSticker }: StickerPanelProps) => {
  const [mainCategory, setMainCategory] = useState<'emoji' | 'cutout'>('emoji');
  const [subcategory, setSubcategory] = useState<string>('hearts');

  const filtered = STICKERS.filter((s) => {
    if (mainCategory === 'emoji') {
      return s.category === subcategory;
    } else {
      return s.category === 'cutout';
    }
  });

  const isCutout = mainCategory === 'cutout';

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-handwriting-patrick text-muted-foreground tracking-wide uppercase">
        ✂️ Stickers
      </h3>

      {/* Main Categories */}
      <div className="flex gap-1">
        {STICKER_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setMainCategory(cat.id as 'emoji' | 'cutout');
              if (cat.id === 'emoji') {
                setSubcategory('hearts');
              }
            }}
            className={`px-2 py-1 rounded-md text-xs font-handwriting-patrick transition-all ${
              mainCategory === cat.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Emoji Subcategories */}
      {mainCategory === 'emoji' && (
        <div className="flex flex-wrap gap-1">
          {EMOJI_SUBCATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSubcategory(cat.id)}
              className={`px-2 py-1 rounded-md text-xs font-handwriting-patrick transition-all ${
                subcategory === cat.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={`${mainCategory}-${subcategory}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className={`${
            isCutout
              ? 'overflow-x-auto overflow-y-hidden pb-2'
              : 'grid grid-cols-6 gap-1'
          }`}
          style={isCutout ? { display: 'flex', gap: '8px' } : undefined}
        >
          {filtered.map((sticker) => (
            <button
              key={sticker.id}
              onClick={() => onAddSticker(sticker)}
              className={`${
                isCutout
                  ? 'flex-shrink-0 w-20 h-20'
                  : 'text-2xl p-1 rounded-lg'
              } hover:bg-secondary/60 transition-colors active:scale-90 transform overflow-hidden rounded-lg flex items-center justify-center`}
              title={sticker.label}
            >
              {sticker.emoji ? (
                <span className={isCutout ? 'text-3xl' : 'text-2xl'}>
                  {sticker.emoji}
                </span>
              ) : sticker.image ? (
                <img
                  src={sticker.image}
                  alt={sticker.label}
                  className="w-full h-full object-contain p-1"
                />
              ) : null}
            </button>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default StickerPanel;
