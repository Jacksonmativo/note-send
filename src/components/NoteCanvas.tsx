import { useState, useRef, useCallback, useMemo } from 'react';
import { toPng } from 'html-to-image';
import { Download, RotateCcw, Sparkles, Type, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import DraggableSticker, { type PlacedSticker } from './DraggableSticker';
import StickerPanel from './StickerPanel';
import ImageUploadPanel from './ImageUploadPanel';
import TextControls from './TextControls';
import BackgroundSelector, { backgrounds } from './BackgroundSelector';
import DrawingCanvas from './DrawingCanvas';
import PhotoEffectsPanel from './PhotoEffectsPanel';
import type { StickerItem, InkColor } from './StickerData';

export interface NoteCanvasProps {
  stickers?: PlacedSticker[];
  onStickersChange?: (stickers: PlacedSticker[]) => void;
  backgroundId?: string;
  onBackgroundChange?: (id: string) => void;
  externalCanvasRef?: React.RefObject<HTMLDivElement>;
}

const NoteCanvas = ({
  stickers: controlledStickers,
  onStickersChange,
  backgroundId: controlledBgId,
  onBackgroundChange,
  externalCanvasRef,
}: NoteCanvasProps = {}) => {
  const internalCanvasRef = useRef<HTMLDivElement>(null);
  const canvasRef = (externalCanvasRef || internalCanvasRef) as React.RefObject<HTMLDivElement>;
  const [inkColor, setInkColor] = useState<InkColor>('blue');
  const [fontFamily, setFontFamily] = useState('Caveat');
  const [fontSize, setFontSize] = useState(24);
  const [internalStickers, setInternalStickers] = useState<PlacedSticker[]>([]);
  const [internalBgId, setInternalBgId] = useState('notebook');
  const [isExporting, setIsExporting] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [effectsTarget, setEffectsTarget] = useState<PlacedSticker | null>(null);

  const stickers = controlledStickers ?? internalStickers;
  const backgroundId = controlledBgId ?? internalBgId;

  const stickersRef = useRef(stickers);
  stickersRef.current = stickers;

  const onStickersChangeRef = useRef(onStickersChange);
  onStickersChangeRef.current = onStickersChange;

  const setStickers = useCallback(
    (updater: PlacedSticker[] | ((prev: PlacedSticker[]) => PlacedSticker[])) => {
      const newValue = typeof updater === 'function' ? updater(stickersRef.current) : updater;
      if (onStickersChangeRef.current) {
        onStickersChangeRef.current(newValue);
      } else {
        setInternalStickers(newValue);
      }
    },
    []
  );

  const setBackgroundId = useCallback(
    (id: string) => {
      if (onBackgroundChange) {
        onBackgroundChange(id);
      } else {
        setInternalBgId(id);
      }
    },
    [onBackgroundChange]
  );

  const inkCssMap: Record<InkColor, string> = {
    blue: 'hsl(215, 60%, 35%)',
    black: 'hsl(220, 20%, 15%)',
    red: 'hsl(0, 70%, 50%)',
  };

  const addTextBox = useCallback(() => {
    const randomTilt = Math.floor(Math.random() * 10) - 5;
    const randomX = 40 + Math.random() * 150;
    const randomY = 60 + Math.random() * 200;
    const id = `text-${Date.now()}`;
    setStickers((prev) => [
      ...prev,
      {
        instanceId: id,
        stickerId: 'text-box',
        textContent: 'Your text here',
        textFont: fontFamily,
        textColor: inkCssMap[inkColor],
        textSize: fontSize,
        x: randomX,
        y: randomY,
        rotation: randomTilt,
        scale: 1,
      },
    ]);
    // Immediately open edit for the new textbox
    setEditingId(id);
    setEditText('Your text here');
  }, [fontFamily, fontSize, inkColor, inkCssMap]);

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
    if (editingId === instanceId) setEditingId(null);
  }, [editingId]);

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
        layer: 'image' as const,
      },
    ]);
  }, []);

  const handleStickerClick = useCallback((sticker: PlacedSticker) => {
    if (sticker.textContent !== undefined) {
      setEditingId(sticker.instanceId);
      setEditText(sticker.textContent);
    }
  }, []);

  const commitEdit = useCallback(() => {
    if (editingId) {
      setStickers((prev) =>
        prev.map((s) =>
          s.instanceId === editingId
            ? { ...s, textContent: editText.slice(0, 300) }
            : s
        )
      );
      setEditingId(null);
    }
  }, [editingId, editText]);

  const handleExport = async () => {
    if (!canvasRef.current) return;
    commitEdit();
    setIsExporting(true);
    try {
      // Use multiple attempts for reliability
      const dataUrl = await toPng(canvasRef.current, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
        skipAutoScale: true,
      });
      const link = document.createElement('a');
      link.download = `note-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export failed:', err);
      // Retry once
      try {
        const dataUrl = await toPng(canvasRef.current!, {
          quality: 1,
          pixelRatio: 2,
          cacheBust: true,
        });
        const link = document.createElement('a');
        link.download = `note-${Date.now()}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (retryErr) {
        console.error('Export retry failed:', retryErr);
      }
    }
    setIsExporting(false);
  };

  const handleReset = () => {
    setStickers([]);
    setEditingId(null);
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
        {/* Add Text Button */}
        <button
          onClick={addTextBox}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground font-handwriting-patrick text-sm hover:opacity-90 transition-opacity"
        >
          <Type className="w-4 h-4" />
          Add Text Box
        </button>
        <div className="border-t border-border" />
        <BackgroundSelector selected={backgroundId} onSelect={setBackgroundId} />
        <div className="border-t border-border" />
        <StickerPanel onAddSticker={addSticker} />
        <div className="border-t border-border" />
        <ImageUploadPanel onAddImageSticker={addImageSticker} />
        <div className="border-t border-border" />
        {/* Draw Sticker Button */}
        <button
          onClick={() => setIsDrawing(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground font-handwriting-patrick text-sm hover:opacity-90 transition-opacity"
        >
          <Pencil className="w-4 h-4" />
          Draw a Sticker
        </button>
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
            backgroundImage: `url(${backgrounds.find(b => b.id === backgroundId)?.src || backgrounds[0].src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          onClick={() => { if (editingId) commitEdit(); }}
        >
          {/* Layer-based rendering: images → stickers → text */}
          {[...stickers]
            .sort((a, b) => {
              const layerOrder = { image: 0, sticker: 1, text: 2 };
              const aLayer = a.textContent !== undefined ? 'text' : (a.layer || (a.imageUrl ? 'image' : 'sticker'));
              const bLayer = b.textContent !== undefined ? 'text' : (b.layer || (b.imageUrl ? 'image' : 'sticker'));
              return (layerOrder[aLayer] || 0) - (layerOrder[bLayer] || 0);
            })
            .map((sticker) => (
            <div key={sticker.instanceId} onDoubleClick={() => handleStickerClick(sticker)}>
              <DraggableSticker
                sticker={sticker}
                onUpdate={updateSticker}
                onDelete={deleteSticker}
                onEffects={sticker.imageUrl ? (s) => setEffectsTarget(s) : undefined}
                containerRef={canvasRef}
              />
            </div>
          ))}

          {/* Inline text editor overlay */}
          {editingId && (() => {
            const s = stickers.find((st) => st.instanceId === editingId);
            if (!s) return null;
            return (
              <div
                className="absolute z-[100]"
                style={{ left: s.x, top: s.y, transform: `rotate(${s.rotation}deg) scale(${s.scale})` }}
                onClick={(e) => e.stopPropagation()}
              >
                <textarea
                  autoFocus
                  value={editText}
                  onChange={(e) => {
                    if (e.target.value.length <= 300) setEditText(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(); }
                    if (e.key === 'Escape') commitEdit();
                  }}
                  className="min-w-[120px] max-w-[220px] min-h-[40px] bg-background/80 border-2 border-primary rounded-md px-2 py-1 outline-none resize"
                  style={{
                    fontFamily: `'${s.textFont || 'Caveat'}', cursive`,
                    fontSize: `${s.textSize || 24}px`,
                    color: s.textColor || 'hsl(215, 60%, 35%)',
                    lineHeight: '1.4',
                  }}
                  maxLength={300}
                />
                <div className="text-xs text-muted-foreground font-handwriting-patrick mt-1">
                  {editText.length}/300 · Enter to save
                </div>
              </div>
            );
          })()}
        </div>
      </motion.div>

      {/* Drawing Canvas Modal */}
      {isDrawing && (
        <DrawingCanvas
          onSave={(dataUrl) => {
            addImageSticker(dataUrl);
            setIsDrawing(false);
          }}
          onClose={() => setIsDrawing(false)}
        />
      )}

      {/* Photo Effects Modal */}
      {effectsTarget && (
        <PhotoEffectsPanel
          sticker={effectsTarget}
          onUpdate={(updated) => {
            updateSticker(updated);
            setEffectsTarget(updated);
          }}
          onClose={() => setEffectsTarget(null)}
        />
      )}
    </div>
  );
};

export default NoteCanvas;
