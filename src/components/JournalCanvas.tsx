import { useState, useRef, useCallback, useEffect } from 'react';
import { Download, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
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
}: JournalCanvasProps) {
  const [mode, setMode] = useState<'writing' | 'math'>('writing');
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#1a1a1a');
  const [size, setSize] = useState(2);
  const [drawing, setDrawing] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
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
      for (let y = lineSpacing; y <= h; y += lineSpacing) {
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
      ctx.strokeStyle = '#b8cfe8'; ctx.lineWidth = 0.8;
      for (let x = step; x < w; x += step) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
      for (let y = step; y < h; y += step) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
      ctx.strokeStyle = '#7aaacf'; ctx.lineWidth = 1.2;
      for (let x = step*5; x < w; x += step*5) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
      for (let y = step*5; y < h; y += step*5) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
    }
  }, [mode]);

  const getXY = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const r = canvas.getBoundingClientRect();
    const scaleX = canvas.width / r.width, scaleY = canvas.height / r.height;
    const src = 'touches' in e ? e.touches[0] : e;
    return { x: (src.clientX - r.left) * scaleX, y: (src.clientY - r.top) * scaleY };
  }, []);

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDrawing(true);
    setLastPos(getXY(e));
  }, [getXY]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || !lastPos) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const pos = getXY(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === 'eraser' ? (mode === 'writing' ? '#fafaf8' : '#ffffff') : color;
    ctx.lineWidth = tool === 'eraser' ? size * 6 : size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    setLastPos(pos);
  }, [drawing, lastPos, getXY, tool, color, size, mode]);

  const stopDraw = useCallback(() => {
    setDrawing(false);
    setLastPos(null);
  }, []);

  const switchMode = () => {
    setMode(mode === 'math' ? 'writing' : 'math');
  };

  const clearCanvas = () => {
    drawGrid();
  };

  const downloadPDF = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Import jsPDF dynamically
    const { jsPDF } = await import('jspdf');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // A4 dimensions in mm
    const a4Width = 210;
    const a4Height = 297;

    // Calculate canvas aspect ratio and fit to A4
    const canvasAspect = canvas.width / canvas.height;
    const a4Aspect = a4Width / a4Height;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (canvasAspect > a4Aspect) {
      // Canvas is wider, fit to width
      drawWidth = a4Width;
      drawHeight = a4Width / canvasAspect;
      offsetX = 0;
      offsetY = (a4Height - drawHeight) / 2;
    } else {
      // Canvas is taller, fit to height
      drawHeight = a4Height;
      drawWidth = a4Height * canvasAspect;
      offsetX = (a4Width - drawWidth) / 2;
      offsetY = 0;
    }

    // Convert canvas to image
    const imgData = canvas.toDataURL('image/png', 1.0);

    // Add image to PDF
    pdf.addImage(imgData, 'PNG', offsetX, offsetY, drawWidth, drawHeight);

    // Download PDF
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
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
        <div className="flex items-center gap-2">
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

      {/* Toolbar */}
      <div
        className="flex items-center gap-3 p-3 border-b border-border flex-wrap"
        style={{ background: theme.bg, borderBottomColor: theme.border }}
      >
        {/* Tools */}
        {(['pen', 'eraser'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTool(t)}
            className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={{
              border: `1px solid ${theme.border}`,
              color: theme.text,
              background: tool === t ? 'rgba(255,255,255,0.9)' : 'transparent',
              fontWeight: tool === t ? 500 : 400,
            }}
          >
            {t === 'pen' ? 'Pen' : 'Eraser'}
          </button>
        ))}

        <div className="w-px h-6 bg-current opacity-30" style={{ background: theme.border }} />

        {/* Colors */}
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => {
              setColor(c);
              setTool('pen');
            }}
            className="w-6 h-6 rounded-full border-2 transition-all"
            style={{
              background: c,
              borderColor: (color === c && tool === 'pen') ? theme.text : 'rgba(0,0,0,0.18)',
            }}
          />
        ))}

        <div className="w-px h-6 bg-current opacity-30" style={{ background: theme.border }} />

        {/* Size */}
        <span className="text-sm font-medium" style={{ color: theme.text }}>Size</span>
        <input
          type="range"
          min="1"
          max="12"
          step="1"
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="w-16"
        />
        <span className="text-sm font-medium min-w-[16px]" style={{ color: theme.text }}>{size}</span>
      </div>

      {/* Canvas */}
      <div ref={wrapRef} className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
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
                onEffects={sticker.imageUrl ? (s) => {
                  // Handle photo effects if needed
                } : undefined}
                containerRef={wrapRef}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}