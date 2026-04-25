import { useState, useRef, useCallback, useEffect } from 'react';
import DraggableSticker, { type PlacedSticker } from './DraggableSticker';
import type { InkColor } from './StickerData';

interface JournalCanvasProps {
  stickers?: PlacedSticker[];
  onStickersChange?: (stickers: PlacedSticker[]) => void;
  backgroundId?: string;
  inkColor?: InkColor;
  fontFamily?: string;
  fontSize?: number;
  previewMode?: boolean;
  zoom?: number;
  mode?: 'writing' | 'math';
}

const PAPER_WIDTH  = 720;
const PAPER_HEIGHT = 1020;

const HIGHLIGHT_PREVIEW: Record<string, string> = {
  yellow: 'rgba(253,224,71,0.55)',
  pink:   'rgba(249,168,212,0.60)',
  lime:   'rgba(163,230,53,0.50)',
};

/** Shared canvas painter — works for both interactive and preview sizes */
function paintGrid(
  canvas: HTMLCanvasElement,
  mode: 'writing' | 'math',
  w: number,
  h: number
) {
  canvas.width  = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  if (mode === 'writing') {
    ctx.fillStyle = '#fafaf8';
    ctx.fillRect(0, 0, w, h);
    const lineSpacing = 24;
    ctx.strokeStyle = '#9ec8e8';
    ctx.lineWidth = 0.7;
    for (let y = lineSpacing * 3; y <= h; y += lineSpacing) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(62, 0); ctx.lineTo(62, h); ctx.stroke();
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    const step = 28;
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 0.9;
    for (let x = step; x < w; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = step; y < h; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  }
}

/** Pure-CSS grid rendered as divs — used in previewMode so html-to-image captures it */
function CssGrid({ mode }: { mode: 'writing' | 'math' }) {
  if (mode === 'writing') {
    const lineSpacing = 24;
    const startY = lineSpacing * 3;
    const lines: number[] = [];
    for (let y = startY; y <= PAPER_HEIGHT; y += lineSpacing) lines.push(y);

    return (
      <>
        {/* Ruled lines */}
        {lines.map((y) => (
          <div
            key={y}
            style={{
              position:        'absolute',
              left:            0,
              top:             y,
              width:           '100%',
              height:          0,
              borderTop:       '0.7px solid #9ec8e8',
              pointerEvents:   'none',
            }}
          />
        ))}
        {/* Red margin line */}
        <div
          style={{
            position:      'absolute',
            top:           0,
            left:          62,
            width:         0,
            height:        '100%',
            borderLeft:    '1.2px solid #c0392b',
            pointerEvents: 'none',
          }}
        />
      </>
    );
  }

  // Math grid
  const step = 28;
  const vLines: number[] = [];
  const hLines: number[] = [];
  for (let x = step; x < PAPER_WIDTH;  x += step) vLines.push(x);
  for (let y = step; y < PAPER_HEIGHT; y += step) hLines.push(y);

  return (
    <>
      {vLines.map((x) => (
        <div
          key={`v${x}`}
          style={{
            position:      'absolute',
            top:           0,
            left:          x,
            width:         0,
            height:        '100%',
            borderLeft:    '0.9px solid #6b7280',
            pointerEvents: 'none',
          }}
        />
      ))}
      {hLines.map((y) => (
        <div
          key={`h${y}`}
          style={{
            position:      'absolute',
            left:          0,
            top:           y,
            width:         '100%',
            height:        0,
            borderTop:     '0.9px solid #6b7280',
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  );
}

export default function JournalCanvas({
  stickers: controlledStickers,
  onStickersChange,
  inkColor = 'blue',
  fontFamily = 'Caveat',
  fontSize = 24,
  previewMode = false,
  zoom = 1,
  mode = 'writing',
}: JournalCanvasProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText,  setEditText]  = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);

  const stickersRef = useRef(controlledStickers);
  stickersRef.current = controlledStickers || [];

  const onStickersChangeRef = useRef(onStickersChange);
  onStickersChangeRef.current = onStickersChange;

  const setStickers = useCallback(
    (updater: PlacedSticker[] | ((prev: PlacedSticker[]) => PlacedSticker[])) => {
      const newValue =
        typeof updater === 'function' ? updater(stickersRef.current) : updater;
      onStickersChangeRef.current?.(newValue);
    },
    []
  );

  /* Interactive grid — reads wrapRef for live dimensions */
  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap   = wrapRef.current;
    if (!canvas || !wrap) return;
    paintGrid(canvas, mode, wrap.clientWidth, wrap.clientHeight);
  }, [mode]);

  /* Mount / mode-change effects — interactive only */
  useEffect(() => {
    if (!previewMode) drawGrid();
  }, [previewMode, drawGrid]);

  /* Resize handler — interactive only */
  useEffect(() => {
    if (previewMode) return;
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
  }, [previewMode, drawGrid]);

  const startEdit = useCallback((sticker: PlacedSticker) => {
    setEditingId(sticker.instanceId);
    setEditText(sticker.textContent ?? '');
  }, []);

  const commitEdit = useCallback(() => {
    if (!editingId) return;
    setStickers((prev) =>
      prev.map((s) =>
        s.instanceId === editingId
          ? { ...s, textContent: editText.slice(0, 400) }
          : s
      )
    );
    setEditingId(null);
  }, [editingId, editText, setStickers]);

  /* ══════════════════════════════════════════════════════
     PREVIEW MODE
     Pure CSS grid + static HTML stickers — no canvas —
     so html-to-image captures every element correctly.
  ══════════════════════════════════════════════════════ */
  if (previewMode) {
    return (
      <div
        style={{
          position:   'relative',
          width:      PAPER_WIDTH,
          height:     PAPER_HEIGHT,
          overflow:   'hidden',
          background: mode === 'writing' ? '#fafaf8' : '#ffffff',
        }}
      >
        {/* CSS grid lines — no canvas needed, fully captured by html-to-image */}
        <CssGrid mode={mode} />

        {stickersRef.current.map((sticker) => (
          <div
            key={sticker.instanceId}
            style={{
              position:        'absolute',
              left:            sticker.x,
              top:             sticker.y,
              transform:       `rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
              transformOrigin: 'top left',
              userSelect:      'none',
              pointerEvents:   'none',
            }}
          >
            {/* Text sticker */}
            {sticker.textContent !== undefined && (
              <div
                style={{
                  position:   'relative',
                  padding:    '4px 8px',
                  fontFamily: `'${sticker.textFont || 'Caveat'}', cursive`,
                  fontSize:   `${sticker.textSize || 24}px`,
                  color:      sticker.textColor || 'hsl(215,60%,35%)',
                  lineHeight: 1.4,
                  textAlign:  sticker.textAlign || 'center',
                  width:      sticker.textWidth ? `${sticker.textWidth}px` : '180px',
                  minWidth:   '60px',
                  whiteSpace: 'pre-wrap',
                  wordBreak:  'break-word',
                }}
              >
                {sticker.textHighlight && sticker.textHighlight !== 'none' && (
                  <span
                    style={{
                      position:     'absolute',
                      inset:        0,
                      background:   HIGHLIGHT_PREVIEW[sticker.textHighlight] ?? 'transparent',
                      borderRadius: 2,
                    }}
                  />
                )}
                <span style={{ position: 'relative' }}>
                  {sticker.textContent || ''}
                </span>
              </div>
            )}

            {/* Image / photo sticker */}
            {sticker.textContent === undefined && sticker.imageUrl && (
              <img
                src={sticker.imageUrl}
                alt=""
                crossOrigin="anonymous"
                style={{
                  width:     96,
                  height:    96,
                  objectFit: 'contain',
                  filter:    sticker.photoFilter || 'none',
                  display:   'block',
                }}
              />
            )}

            {/* Emoji sticker */}
            {sticker.textContent === undefined && !sticker.imageUrl && sticker.emoji && (
              <span
                style={{
                  fontSize:   40,
                  lineHeight: 1,
                  display:    'block',
                  filter:     'drop-shadow(0 1px 2px rgba(0,0,0,0.18))',
                }}
              >
                {sticker.emoji}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════
     INTERACTIVE MODE
  ══════════════════════════════════════════════════════ */
  return (
    <div
      ref={wrapRef}
      className="relative border border-border bg-white shadow-lg"
      style={{
        width:           PAPER_WIDTH,
        height:          PAPER_HEIGHT,
        transform:       `scale(${zoom})`,
        transformOrigin: 'top left',
        overflow:        'visible',
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ borderRadius: 'inherit' }}
      />

      <div
        className="absolute pointer-events-none"
        style={{ inset: 0, overflow: 'visible' }}
      >
        {stickersRef.current.map((sticker) => (
          <div key={sticker.instanceId} className="pointer-events-auto">
            <DraggableSticker
              sticker={sticker}
              onUpdate={(updated) =>
                setStickers((prev) =>
                  prev.map((s) => s.instanceId === updated.instanceId ? updated : s)
                )
              }
              onDelete={(id) =>
                setStickers((prev) => prev.filter((s) => s.instanceId !== id))
              }
              onDoubleClick={sticker.textContent !== undefined ? startEdit : undefined}
              hidePlaceholder={editingId === sticker.instanceId}
              showTextStretch={sticker.textContent !== undefined}
              showTextResize={sticker.textContent === undefined}
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
            onKeyDown={(e) => { if (e.key === 'Escape') setEditingId(null); }}
            className="absolute bg-transparent p-2 text-sm leading-6 outline-none resize-none"
            style={{
              left:            sticker.x,
              top:             sticker.y,
              minWidth:        '140px',
              width:           sticker.textWidth ? `${sticker.textWidth}px` : '220px',
              fontFamily:      `'${sticker.textFont || 'Caveat'}', cursive`,
              fontSize:        `${sticker.textSize || 24}px`,
              color:           sticker.textColor || 'hsl(215, 60%, 35%)',
              textAlign:       sticker.textAlign || 'center',
              transform:       `rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
              transformOrigin: 'top left',
            }}
            maxLength={400}
          />
        );
      })()}
    </div>
  );
}