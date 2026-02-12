import { useState } from 'react';
import { STICKERS, STICKER_CATEGORIES, type StickerItem } from './StickerData';
import { motion, AnimatePresence } from 'framer-motion';

interface StickerPanelProps {
  onAddSticker: (sticker: StickerItem) => void;
}

const StickerPanel = ({ onAddSticker }: StickerPanelProps) => {
  const [activeCategory, setActiveCategory] = useState<string>('hearts');

  const filtered = STICKERS.filter((s) => s.category === activeCategory);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-handwriting-patrick text-muted-foreground tracking-wide uppercase">
        ✂️ Stickers
      </h3>
      <div className="flex flex-wrap gap-1">
        {STICKER_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-2 py-1 rounded-md text-xs font-handwriting-patrick transition-all ${
              activeCategory === cat.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="grid grid-cols-6 gap-1"
        >
          {filtered.map((sticker) => (
            <button
              key={sticker.id}
              onClick={() => onAddSticker(sticker)}
              className="text-2xl p-1 rounded-lg hover:bg-secondary/60 transition-colors active:scale-90 transform"
              title={sticker.label}
            >
              {sticker.emoji}
            </button>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default StickerPanel;
