import { useState, useRef, useCallback, useEffect } from 'react';
import { Download, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import DraggableSticker, { type PlacedSticker } from './DraggableSticker';
import { backgrounds } from './BackgroundSelector';
import type { InkColor } from './StickerData';

interface JournalCanvasProps {
  stickers?: PlacedSticker[];
  onStickersChange?: (stickers: PlacedSticker[]) => void;
  backgroundId?: string;
  onBackgroundChange?: (id: string) => void;
  inkColor?: InkColor;
  fontFamily?: string;
  fontSize?: number;
  previewMode?: boolean;
  onDownloadAllPages?: () => void;
}

const COLORS = ['#1a1a1a', '#dc2626', '#2563eb', '#16a34a', '#d97706', '#7c3aed'];

export default function JournalCanvas({
  stickers: controlledStickers,
  onStickersChange,
  backgroundId: controlledBgId = 'notebook',
  onBackgroundChange,
  inkColor = 'blue',
  fontFamily = 'Caveat',
  fontSize = 24,
  previewMode = false,
  onDownloadAllPages,
}: JournalCanvasProps) {
  const [mode, setMode] = useState<'writing' | 'math'>('writing');
  const [zoom, setZoom] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const PAPER_WIDTH = 720;
  const PAPER_HEIGHT = 1020;
  const MIN_ZOOM = 0.7;
  const MAX_ZOOM = 1.8;
  const ZOOM_STEP = 0.1;
  const wrapRef = useRef<HTMLDivElement>(null);
  const stickersRef = useRef(controlledStickers);
  stickersRef.current = controlledStickers || [];

  const onStickersChangeRef = useRef(onStickersChange);
  onStickersChangeRef.current = onStickersChange;

  const setStickers = useCallback(
    (updater: PlacedSticker[] | ((prev: PlacedSticker[]) => PlacedSticker[])) => {
      const newValue = typeof updater === 'function' ? updater(stickersRef.current) : updater;
      if (onStickersChangeRef.current) {
        onStickersChangeRef.current(newValue);
      }
    },
    []
  );

  const getTheme = () => {
    if (mode === 'math') return { bg: '#FEF9E7', text: '#7D6608', border: '#F9E79F' };
    return { bg: '#EBF5FB', text: '#1B4F72', border: '#AED6F1' };
  };

  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    canvas.width = wrap.clientWidth;
    canvas.height = wrap.clientHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width, h = canvas.height;

    if (mode === 'writing') {
      // Off-white paper background
      ctx.fillStyle = '#fafaf8';
      ctx.fillRect(0, 0, w, h);

      const lineSpacing = 24;
      // Thin, evenly spaced blue horizontal lines
      ctx.strokeStyle = '#9ec8e8';
      ctx.lineWidth = 0.7;
      for (let y = lineSpacing * 3; y <= h; y += lineSpacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      // Red margin line
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 1.2;
      const marginX = 62;
      ctx.beginPath(); ctx.moveTo(marginX, 0); ctx.lineTo(marginX, h); ctx.stroke();
    } else {
      // Math grid
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      const step = 28;
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 0.9;
      for (let x = step; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = step; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }
  }, [mode]);

  const startEdit = useCallback((sticker: PlacedSticker) => {
    setEditingId(sticker.instanceId);
    setEditText(sticker.textContent ?? '');
  }, []);

  const commitEdit = useCallback(() => {
    if (!editingId) return;
    setStickers((prev) =>
      prev.map((s) =>
        s.instanceId === editingId ? { ...s, textContent: editText.slice(0, 400) } : s
      )
    );
    setEditingId(null);
  }, [editingId, editText]);

  const switchMode = () => {
    setMode(mode === 'math' ? 'writing' : 'math');
  };

  const clearCanvas = () => {
    drawGrid();
  };

  const downloadPDF = async () => {
    if (onDownloadAllPages) {
      onDownloadAllPages();
      return;
    }

    const wrap = wrapRef.current;
    if (!wrap) return;

    const previousTransform = wrap.style.transform;
    wrap.style.transform = 'none';
    const imageData = await toPng(wrap, { cacheBust: true, backgroundColor: '#ffffff' });
    wrap.style.transform = previousTransform;

    // Import jsPDF dynamically
    const { jsPDF } = await import('jspdf');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const a4Width = 210;
    const a4Height = 297;

    pdf.addImage(imageData, 'PNG', 0, 0, a4Width, a4Height);
    pdf.save(`journal-${Date.now()}.pdf`);
  };

  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const saved = canvas.toDataURL();
      drawGrid();
      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0);
      };
      img.src = saved;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawGrid]);

  const theme = getTheme();

  if (previewMode) {
    return (
      <div
        ref={wrapRef}
        className="relative overflow-hidden border border-border bg-white"
        style={{ width: PAPER_WIDTH, height: PAPER_HEIGHT }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        <div className="absolute inset-0 pointer-events-none">
          {stickersRef.current.map((sticker) => (
            <div key={sticker.instanceId} className="pointer-events-none">
              <DraggableSticker
                sticker={sticker}
                onUpdate={() => undefined}
                onDelete={() => undefined}
                hidePlaceholder
                showTextStretch={false}
                showTextResize={false}
                containerRef={wrapRef}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 bg-card border-b border-border">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-heading font-semibold">
            {mode === 'math' ? '∑ Maths Journal' : '✎ Writing Journal'}
          </h2>
          <button
            onClick={switchMode}
            className="px-3 py-1.5 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium"
          >
            Switch to {mode === 'math' ? '✎ Writing' : '∑ Maths'}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-sm text-foreground">
            <button
              onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))}
              className="h-8 w-8 rounded-full border border-border bg-muted hover:bg-muted/90 transition-colors"
              title="Zoom out"
            >
              −
            </button>
            <span className="px-3 font-medium">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
              className="h-8 w-8 rounded-full border border-border bg-muted hover:bg-muted/90 transition-colors"
              title="Zoom in"
            >
              +
            </button>
          </div>

          <button
            onClick={clearCanvas}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            title="Clear canvas"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-border bg-background text-sm text-muted-foreground">
        Use the Text, Stickers, Upload, and Draw tools above to add content to your journal.
        <br />
        (DO NOT CLOSE THE PAGE BEFORE SAVING YOUR WORK, as there is no auto-save feature yet!)
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-slate-100/40 p-4">
        <div
          ref={wrapRef}
          className="relative overflow-hidden border border-border bg-white shadow-lg"
          style={{
            width: PAPER_WIDTH,
            height: PAPER_HEIGHT,
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
          }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />

          {/* Stickers and Text Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {stickersRef.current.map((sticker) => (
              <div key={sticker.instanceId} className="pointer-events-auto">
                <DraggableSticker
                  sticker={sticker}
                  onUpdate={(updated) => {
                    setStickers((prev) =>
                      prev.map((s) => (s.instanceId === updated.instanceId ? updated : s))
                    );
                  }}
                  onDelete={(id) => {
                    setStickers((prev) => prev.filter((s) => s.instanceId !== id));
                  }}
                  onDoubleClick={sticker.textContent !== undefined ? startEdit : undefined}
                  hidePlaceholder={editingId === sticker.instanceId}
                  showTextStretch={sticker.textContent !== undefined}
                  showTextResize={sticker.textContent === undefined}
                  onEffects={sticker.imageUrl ? (s) => {
                    // Handle photo effects if needed
                  } : undefined}
                  containerRef={wrapRef}
                />
              </div>
            ))}
          </div>

          {editingId && (() => {
            const sticker = stickersRef.current.find((s) => s.instanceId === editingId);
            if (!sticker) return null;
            return (
              <textarea
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setEditingId(null);
                  }
                }}
                className="absolute bg-transparent p-2 text-sm leading-6 outline-none"
                style={{
                  left: sticker.x,
                  top: sticker.y,
                  minWidth: '140px',
                  width: sticker.textWidth ? `${sticker.textWidth}px` : '220px',
                  fontFamily: `'${sticker.textFont || 'Caveat'}', cursive`,
                  fontSize: `${sticker.textSize || 24}px`,
                  color: sticker.textColor || 'hsl(215, 60%, 35%)',
                  textAlign: sticker.textAlign || 'center',
                  transform: `rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
                  transformOrigin: 'top left',
                }}
                maxLength={400}
              />
            );
          })()}
        </div>
      </div>
    </div>
  );
}