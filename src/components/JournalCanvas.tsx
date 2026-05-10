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
  blue:   'rgba(96,165,250,0.50)',
  gray:   'rgba(156,163,175,0.50)'
};

// Pen color map — matches InkColor values to real CSS colors
const INK_COLORS: Record<string, string> = {
  blue:   'hsl(215,60%,35%)',
  black:  'hsl(220,20%,15%)',
  red:    'hsl(0,70%,50%)',
  green:  'hsl(140,50%,35%)',
  purple: 'hsl(270,55%,45%)',
  orange: 'hsl(28,85%,48%)',
};

/**
 * Shared formula: how far below sticker.y (or the text div's top) the
 * underline sits.  Both interactive and preview must use this so the
 * downloaded image matches what you see in the editor.
 *
 * Breakdown:
 *   4px  — padding-top of the text div
 *   fontSize * 1.4 — one line of text at lineHeight 1.4
 *   1px  — small breathing gap
 *
 * For multi-line text this will sit below line 1, but it is at least
 * consistent between the two modes.
 */
function underlineTopOffset(fontSize: number): number {
  return 4 + fontSize * 1.1 + 1;
}

/**
 * Generates a deterministic irregular SVG underline path.
 * Uses a seeded pseudo-random so the same text always gets
 * the same wobble — no jitter on every render.
 */
function buildWobblePath(width: number, seed: number): string {
  // Tiny seeded LCG so the path is stable across re-renders
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };

  const segments = Math.max(6, Math.floor(width / 18));
  const step     = width / segments;
  const amp      = 2.2; // vertical wobble amplitude (px)

  let d = `M 0 ${amp + rand() * amp}`;
  for (let i = 1; i <= segments; i++) {
    const x  = i * step;
    const y  = amp + rand() * amp;
    // Gentle quadratic bezier through a mid-control-point
    const cx = (i - 0.5) * step;
    const cy = amp * (0.2 + rand() * 1.6);
    d += ` Q ${cx} ${cy} ${x} ${y}`;
  }
  return d;
}

/** Irregular underline SVG — rendered inline so html-to-image captures it */
function WobbleUnderline({
  width,
  color,
  seed,
}: {
  width: number;
  color: string;
  seed: number;
}) {
  const svgH = 7;
  return (
    <svg
      width={width}
      height={svgH}
      viewBox={`0 0 ${width} ${svgH}`}
      style={{
        display:        'block',
        overflow:       'visible',
        pointerEvents:  'none',
        marginTop:      '1px',
      }}
      aria-hidden="true"
    >
      <path
        d={buildWobblePath(width, seed)}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
        {lines.map((y) => (
          <div
            key={y}
            style={{
              position:      'absolute',
              left:          0,
              top:           y,
              width:         '100%',
              height:        0,
              borderTop:     '0.7px solid #9ec8e8',
              pointerEvents: 'none',
            }}
          />
        ))}
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

  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap   = wrapRef.current;
    if (!canvas || !wrap) return;
    paintGrid(canvas, mode, wrap.clientWidth, wrap.clientHeight);
  }, [mode]);

  useEffect(() => {
    if (!previewMode) drawGrid();
  }, [previewMode, drawGrid]);

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
          ? { ...s, textContent: editText.slice(0, 2000) }
          : s
      )
    );
    setEditingId(null);
  }, [editingId, editText, setStickers]);

  /* ══════════════════════════════════════════════════════
     PREVIEW MODE
  ══════════════════════════════════════════════════════ */
  if (previewMode) {
    return (
      <div
        style={{
          position:        'relative',
          width:           PAPER_WIDTH,
          height:          PAPER_HEIGHT,
          overflow:        'hidden',
          background:      mode === 'writing' ? '#fafaf8' : '#ffffff',
          transform:       'none',
          transformOrigin: 'top left',
        }}
      >
        <CssGrid mode={mode} />

        {stickersRef.current.map((sticker) => {
          // Derive wobble seed from instanceId for stability
          const seed = sticker.instanceId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
          const underlinkWidth = sticker.textWidth ?? 180;
          const underlineColor = INK_COLORS[sticker.textColor?.match(/hsl\((\d+)/)?.[1] === '215' ? 'blue'
            : sticker.textColor?.match(/hsl\((\d+)/)?.[1] === '0'   ? 'red'
            : sticker.textColor?.match(/hsl\((\d+)/)?.[1] === '220' ? 'black'
            : sticker.textColor?.match(/hsl\((\d+)/)?.[1] === '140' ? 'green'
            : 'blue'] ?? sticker.textColor ?? INK_COLORS.blue;

          return (
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
                // Use `position: relative` wrapper so the underline can be
                // absolutely positioned with the same offset formula used in
                // interactive mode — this is what keeps them in sync on export.
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      position:   'relative',
                      padding:    '4px 8px',
                      fontFamily: `'${sticker.textFont || 'Caveat'}', cursive`,
                      fontSize:   `${sticker.textSize || 24}px`,
                      color:      sticker.textColor || 'hsl(215,60%,35%)',
                      lineHeight: 1.4,
                      textAlign:  sticker.textAlign || 'center',
                      width:      sticker.textWidth ? `${sticker.textWidth}px` : '120px',
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

                  {/* Underline: absolutely positioned using the shared offset formula */}
                  {sticker.textUnderline && (
                    <div
                      style={{
                        position:      'absolute',
                        left:          0,
                        top:           underlineTopOffset(sticker.textSize || 24),
                        pointerEvents: 'none',
                      }}
                    >
                      <WobbleUnderline
                        width={underlinkWidth}
                        color={underlineColor}
                        seed={seed}
                      />
                    </div>
                  )}
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
          );
        })}
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
        {stickersRef.current.map((sticker) => {
          const seed = sticker.instanceId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
          const underlineWidth = sticker.textWidth ?? 180;
          const underlineColor = sticker.textColor || INK_COLORS.blue;

          return (
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
                zoom={zoom}
              />

              {/* Underline: uses the shared offset formula so it matches the download */}
              {sticker.textContent !== undefined && sticker.textUnderline && (
                <div
                  style={{
                    position:        'absolute',
                    left:            sticker.x,
                    top:             sticker.y + underlineTopOffset(sticker.textSize || 24),
                    transform:       `rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
                    transformOrigin: 'top left',
                    pointerEvents:   'none',
                  }}
                >
                  <WobbleUnderline
                    width={underlineWidth}
                    color={underlineColor}
                    seed={seed}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingId && (() => {
        const sticker = stickersRef.current.find((s) => s.instanceId === editingId);
        if (!sticker) return null;

        const hasUnderline = !!sticker.textUnderline;
        const underlineColor = sticker.textColor || INK_COLORS.blue;

        return (
          <div
            style={{
              position:        'absolute',
              left:            sticker.x,
              top:             sticker.y,
              transform:       `rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
              transformOrigin: 'top left',
              display:         'flex',
              flexDirection:   'column',
              alignItems:      'flex-end',
            }}
          >
            <textarea
              autoFocus
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => { if (e.key === 'Escape') setEditingId(null); }}
              className="bg-transparent p-2 text-sm leading-6 resize-none"
              style={{
                minWidth:        '140px',
                width:           sticker.textWidth ? `${sticker.textWidth}px` : '220px',
                fontFamily:      `'${sticker.textFont || 'Caveat'}', cursive`,
                fontSize:        `${sticker.textSize || 24}px`,
                color:           sticker.textColor || 'hsl(215, 60%, 35%)',
                textAlign:       sticker.textAlign || 'center',
                outline:         'none',
                border:          '1.5px solid #bfdbfe',
                borderRadius:    '3px',
                boxSizing:       'border-box',
              }}
              maxLength={2000}
            />

            {/* Bottom bar: underline toggle + char counter */}
            <div
              style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                width:          sticker.textWidth ? `${sticker.textWidth}px` : '220px',
                marginTop:      '3px',
              }}
            >
              {/* Underline toggle button */}
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  setStickers((prev) =>
                    prev.map((s) =>
                      s.instanceId === editingId
                        ? { ...s, textUnderline: !s.textUnderline }
                        : s
                    )
                  );
                }}
                title={hasUnderline ? 'Remove underline' : 'Add irregular underline'}
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  gap:            '5px',
                  padding:        '2px 7px',
                  borderRadius:   '5px',
                  border:         `1.5px solid ${hasUnderline ? underlineColor : '#d1d5db'}`,
                  background:     hasUnderline ? `${underlineColor}18` : 'transparent',
                  cursor:         'pointer',
                  userSelect:     'none',
                }}
              >
                <svg width="22" height="7" viewBox="0 0 22 7" aria-hidden="true">
                  <path
                    d={buildWobblePath(22, 42)}
                    fill="none"
                    stroke={hasUnderline ? underlineColor : '#9ca3af'}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span style={{
                  fontSize:   '11px',
                  fontFamily: 'sans-serif',
                  color:      hasUnderline ? underlineColor : '#9ca3af',
                  fontWeight: hasUnderline ? 700 : 400,
                }}>
                  {hasUnderline ? 'underlined' : 'underline'}
                </span>
              </button>

              {/* Character counter */}
              <span
                style={{
                  fontSize:   '11px',
                  color:      '#9ca3af',
                  fontFamily: 'sans-serif',
                  lineHeight: 1,
                }}
              >
                {editText.length}/2000
              </span>
            </div>
          </div>
        );
      })()}
    </div>
  );
  }