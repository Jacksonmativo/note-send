import { useState, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { Download, RotateCcw, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import notebookBg from '@/assets/notebook-bg.jpg';
import DraggableSticker, { type PlacedSticker } from './DraggableSticker';
import StickerPanel from './StickerPanel';
import ImageUploadPanel from './ImageUploadPanel';
import TextControls from './TextControls';
import type { StickerItem, InkColor } from './StickerData';

const NoteCanvas = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState('');
  const [inkColor, setInkColor] = useState<InkColor>('blue');
  const [fontFamily, setFontFamily] = useState('Caveat');
  const [fontSize, setFontSize] = useState(24);
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const inkCssMap: Record<InkColor, string> = {
    blue: 'hsl(215, 60%, 35%)',
    black: 'hsl(220, 20%, 15%)',
    red: 'hsl(0, 70%, 50%)',
  };

  const addSticker = useCallback((item: StickerItem) => {
    const randomTilt = Math.floor(Math.random() * 30) - 15;
    const randomX = 80 + Math.random() * 200;
    const randomY = 80 + Math.random() * 250;
    setStickers((prev) => [
      ...prev,
      {
        instanceId: `${item.id}-${Date.now()}`,
        stickerId: item.id,
        emoji: item.emoji,
        x: randomX,
        y: randomY,
        rotation: randomTilt,
        scale: 1,
      },
    ]);
  }, []);

  const updateSticker = useCallback((updated: PlacedSticker) => {
    setStickers((prev) =>
      prev.map((s) => (s.instanceId === updated.instanceId ? updated : s))
    );
  }, []);

  const deleteSticker = useCallback((instanceId: string) => {
    setStickers((prev) => prev.filter((s) => s.instanceId !== instanceId));
  }, []);

  const addImageSticker = useCallback((imageUrl: string) => {
    const randomTilt = Math.floor(Math.random() * 20) - 10;
    const randomX = 80 + Math.random() * 200;
    const randomY = 80 + Math.random() * 250;
    setStickers((prev) => [
      ...prev,
      {
        instanceId: `img-${Date.now()}`,
        stickerId: 'custom-image',
        imageUrl,
        x: randomX,
        y: randomY,
        rotation: randomTilt,
        scale: 1,
      },
    ]);
  }, []);

  const handleExport = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(canvasRef.current, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = 'old-school-note.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
    setIsExporting(false);
  };

  const handleReset = () => {
    setText('');
    setStickers([]);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-5xl mx-auto p-4">
      {/* Side Panel */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="lg:w-56 w-full flex flex-col gap-4 bg-card rounded-xl p-4 paper-shadow"
      >
        <TextControls
          inkColor={inkColor}
          fontFamily={fontFamily}
          fontSize={fontSize}
          onInkChange={setInkColor}
          onFontChange={setFontFamily}
          onSizeChange={setFontSize}
        />
        <div className="border-t border-border" />
        <StickerPanel onAddSticker={addSticker} />
        <div className="border-t border-border" />
        <ImageUploadPanel onAddImageSticker={addImageSticker} />
        <div className="border-t border-border" />
        <div className="flex flex-col gap-2">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-handwriting-patrick text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Saving...' : 'Download Image'}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-handwriting-patrick text-sm hover:bg-secondary/80 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Start Over
          </button>
        </div>
      </motion.div>

      {/* Canvas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex-1 flex justify-center"
      >
        <div
          ref={canvasRef}
          className="relative w-full max-w-lg aspect-[3/4] rounded-lg overflow-hidden paper-shadow"
          style={{
            backgroundImage: `url(${notebookBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Text area overlay */}
          <div className="absolute inset-0 flex items-start justify-center p-12 pt-16">
            <textarea
              value={text}
              onChange={(e) => {
                if (e.target.value.length <= 300) setText(e.target.value);
              }}
              placeholder="Write your note here..."
              maxLength={300}
              className="w-full h-full bg-transparent border-none outline-none resize-none leading-[1.85rem] placeholder:opacity-30"
              style={{
                fontFamily: `'${fontFamily}', cursive`,
                fontSize: `${fontSize}px`,
                color: inkCssMap[inkColor],
                lineHeight: '1.85rem',
              }}
            />
          </div>

          {/* Character count */}
          <div
            className="absolute bottom-3 right-4 text-xs font-handwriting-patrick opacity-30"
            style={{ color: inkCssMap[inkColor] }}
          >
            {text.length}/300
          </div>

          {/* Stickers */}
          {stickers.map((sticker) => (
            <DraggableSticker
              key={sticker.instanceId}
              sticker={sticker}
              onUpdate={updateSticker}
              onDelete={deleteSticker}
              containerRef={canvasRef}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default NoteCanvas;
