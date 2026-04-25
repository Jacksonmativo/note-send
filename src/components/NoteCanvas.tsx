import { useState, useRef, useCallback, useMemo } from 'react';
import { toPng } from 'html-to-image';
import { Download, RotateCcw, Sparkles, Type, Pencil, Palette, ImageIcon, SmilePlus, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import DraggableSticker, { type PlacedSticker } from './DraggableSticker';
import StickerPanel from './StickerPanel';
import ImageUploadPanel from './ImageUploadPanel';
import TextControls from './TextControls';
import BackgroundSelector, { backgrounds } from './BackgroundSelector';
import DrawingCanvas from './DrawingCanvas';
import PhotoEffectsPanel from './PhotoEffectsPanel';
import CoffeePopup from './CoffeePopup';
import type { StickerItem, InkColor } from './StickerData';

export interface NoteCanvasProps {
  stickers?: PlacedSticker[];
  onStickersChange?: (stickers: PlacedSticker[]) => void;
  backgroundId?: string;
  onBackgroundChange?: (id: string) => void;
  externalCanvasRef?: React.RefObject<HTMLDivElement>;
  inkColor?: InkColor;
  fontFamily?: string;
  fontSize?: number;
}

const NoteCanvas = ({
  stickers: controlledStickers,
  onStickersChange,
  backgroundId: controlledBgId,
  onBackgroundChange,
  externalCanvasRef,
  inkColor: controlledInkColor = 'blue',
  fontFamily: controlledFontFamily = 'Caveat',
  fontSize: controlledFontSize = 24,
}: NoteCanvasProps = {}) => {
  const internalCanvasRef = useRef<HTMLDivElement>(null);
  const canvasRef = (externalCanvasRef || internalCanvasRef) as React.RefObject<HTMLDivElement>;
  const [internalStickers, setInternalStickers] = useState<PlacedSticker[]>([]);
  const [internalBgId, setInternalBgId] = useState('notebook');
  const [isExporting, setIsExporting] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [effectsTarget, setEffectsTarget] = useState<PlacedSticker | null>(null);
  const [showCoffeePopup, setShowCoffeePopup] = useState(false);

  const stickers = controlledStickers ?? internalStickers;
  const backgroundId = controlledBgId ?? internalBgId;
  const inkColor = controlledInkColor;
  const fontFamily = controlledFontFamily;
  const fontSize = controlledFontSize;

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
    green: 'hsl(140, 50%, 45%)',
  };

  const addTextBox = useCallback(() => {
    const randomX = 40 + Math.random() * 150;
    const randomY = 60 + Math.random() * 200;
    const id = `text-${Date.now()}`;
    setStickers((prev) => [
      ...prev,
      {
        instanceId: id,
        stickerId: 'text-box',
        textContent: '',
        textFont: fontFamily,
        textColor: inkCssMap[inkColor],
        textSize: fontSize,
        textAlign: 'center' as const,
        x: randomX,
        y: randomY,
        rotation: 0,
        scale: 1,
      },
    ]);
    setEditingId(id);
    setEditText('');
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
        imageUrl: item.image,
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
            ? {
                ...s,
                textContent: editText.slice(0, 400),
                textFont: fontFamily,
                textColor: inkCssMap[inkColor],
                textSize: fontSize,
              }
            : s
        )
      );
      setEditingId(null);
    }
  }, [editingId, editText, fontFamily, inkColor, fontSize, inkCssMap]);

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
      setShowCoffeePopup(true);
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
        setShowCoffeePopup(true);
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
    <div className="w-full max-w-lg mx-auto">
      <div
        ref={canvasRef}
        className="relative w-full aspect-[3/4] rounded-lg overflow-hidden shadow-lg border border-border"
        style={{
          backgroundImage: `url(${backgrounds.find(b => b.id === backgroundId)?.src || backgrounds[0].src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        onClick={() => { if (editingId) commitEdit(); }}
      >
        {/* Empty state */}
        {stickers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-sm font-medium mb-1">Tap to start writing</p>
              <p className="text-xs">Use the toolbar above to add text, stickers, and more</p>
            </div>
          </div>
        )}

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
                onDoubleClick={handleStickerClick}
                hidePlaceholder={editingId === sticker.instanceId}
                containerRef={canvasRef}
              />
            </div>
          ))}

        {/* Inline text editor overlay */}
        {editingId && (() => {
          const s = stickers.find((st) => st.instanceId === editingId);
          if (!s) return null;
          const currentAlign = s.textAlign || 'center';
          return (
            <div
              className="absolute z-[100]"
              style={{ left: s.x, top: s.y, transform: `rotate(${s.rotation}deg) scale(${s.scale})` }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Alignment toolbar */}
              <div className="flex gap-1 mb-1">
                {([['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]] as const).map(([align, Icon]) => (
                  <button
                    key={align}
                    onClick={() => {
                      setStickers((prev) =>
                        prev.map((st) => st.instanceId === editingId ? { ...st, textAlign: align } : st)
                      );
                      if (align === 'center') {
                        setEditText((prev) => prev + '\n');
                      }
                    }}
                    className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
                      currentAlign === align ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
              <textarea
                autoFocus
                value={editText}
                placeholder="Your text here"
                onChange={(e) => {
                  if (e.target.value.length <= 400) setEditText(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') commitEdit();
                }}
                className="min-h-[40px] bg-background/80 border-2 border-primary rounded-md px-2 py-1 outline-none resize-x placeholder:text-muted-foreground/50"
                style={{
                  fontFamily: `'${fontFamily}', cursive`,
                  fontSize: `${fontSize}px`,
                  color: inkCssMap[inkColor],
                  lineHeight: '1.4',
                  textAlign: currentAlign,
                  width: s.textWidth ? `${s.textWidth}px` : '180px',
                  minWidth: '120px',
                  maxWidth: '400px',
                }}
                maxLength={400}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {editText.length}/400 · Esc to save
              </div>
            </div>
          );
        })()}
      </div>

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

      {/* Coffee Popup */}
      <CoffeePopup isOpen={showCoffeePopup} onClose={() => setShowCoffeePopup(false)} />
    </div>
  );
};

export default NoteCanvas;