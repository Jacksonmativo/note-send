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
        textContent: '',
        textFont: fontFamily,
        textColor: inkCssMap[inkColor],
        textSize: fontSize,
        textAlign: 'center' as const,
        x: randomX,
        y: randomY,
        rotation: randomTilt,
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
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full lg:w-56 flex flex-row lg:flex-col gap-2 lg:gap-4 bg-card rounded-xl p-3 lg:p-4 paper-shadow overflow-x-auto flex-shrink-0"
      >
        {/* Text Controls Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent text-accent-foreground font-handwriting-patrick text-sm hover:opacity-90 transition-opacity whitespace-nowrap lg:w-full">
              <Type className="w-4 h-4" />
              Text & Fonts
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="center" className="w-[calc(100vw-2rem)] max-w-64 p-3 lg:w-64" sideOffset={8}>
            <TextControls
              inkColor={inkColor}
              fontFamily={fontFamily}
              fontSize={fontSize}
              onInkChange={setInkColor}
              onFontChange={setFontFamily}
              onSizeChange={setFontSize}
            />
            <button
              onClick={addTextBox}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-handwriting-patrick text-sm hover:opacity-90 transition-opacity w-full mt-3"
            >
              <Type className="w-4 h-4" />
              Add Text Box
            </button>
          </PopoverContent>
        </Popover>

        {/* Background Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent text-accent-foreground font-handwriting-patrick text-sm hover:opacity-90 transition-opacity whitespace-nowrap lg:w-full">
              <Palette className="w-4 h-4" />
              Backgrounds
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="center" className="w-[calc(100vw-2rem)] max-w-72 p-3 lg:w-72" sideOffset={8}>
            <BackgroundSelector selected={backgroundId} onSelect={setBackgroundId} />
          </PopoverContent>
        </Popover>

        {/* Stickers Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent text-accent-foreground font-handwriting-patrick text-sm hover:opacity-90 transition-opacity whitespace-nowrap lg:w-full">
              <SmilePlus className="w-4 h-4" />
              Stickers
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="center" className="w-[calc(100vw-2rem)] max-w-64 p-3 lg:w-64" sideOffset={8}>
            <StickerPanel onAddSticker={addSticker} />
          </PopoverContent>
        </Popover>

        {/* Image Upload Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent text-accent-foreground font-handwriting-patrick text-sm hover:opacity-90 transition-opacity whitespace-nowrap lg:w-full">
              <ImageIcon className="w-4 h-4" />
              Upload Photo
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="center" className="w-[calc(100vw-2rem)] max-w-64 p-3 lg:w-64" sideOffset={8}>
            <ImageUploadPanel onAddImageSticker={addImageSticker} />
          </PopoverContent>
        </Popover>
        {/* Draw Sticker Button */}
        <button
          onClick={() => setIsDrawing(true)}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent text-accent-foreground font-handwriting-patrick text-sm hover:opacity-90 transition-opacity whitespace-nowrap lg:w-full"
        >
          <Pencil className="w-4 h-4" />
          Draw a Sticker
        </button>
        <div className="flex flex-row lg:flex-col gap-2">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground font-handwriting-patrick text-sm hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span className="hidden lg:inline">{isExporting ? 'Saving...' : 'Download'}</span>
            <span className="lg:hidden">{isExporting ? '...' : 'Save'}</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-secondary text-secondary-foreground font-handwriting-patrick text-sm hover:bg-secondary/80 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden lg:inline">Start Over</span>
            <span className="lg:hidden">Reset</span>
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
                    if (e.target.value.length <= 300) setEditText(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(); }
                    if (e.key === 'Escape') commitEdit();
                  }}
                  className="min-w-[120px] max-w-[220px] min-h-[40px] bg-background/80 border-2 border-primary rounded-md px-2 py-1 outline-none resize placeholder:text-muted-foreground/50"
                  style={{
                    fontFamily: `'${s.textFont || 'Caveat'}', cursive`,
                    fontSize: `${s.textSize || 24}px`,
                    color: s.textColor || 'hsl(215, 60%, 35%)',
                    lineHeight: '1.4',
                    textAlign: currentAlign,
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
