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

const HIGHLIGHT_COLORS: Record<string, string> = {
  yellow: 'rgba(253,224,71,0.55)',
  pink:   'rgba(249,168,212,0.60)',
  lime:   'rgba(163,230,53,0.50)',
  blue:   'rgba(96,165,250,0.50)',
  gray:   'rgba(156,163,175,0.50)',
};

const INK_COLORS: Record<string, string> = {
  blue:   'hsl(215,60%,35%)',
  black:  'hsl(220,20%,15%)',
  red:    'hsl(0,70%,50%)',
  green:  'hsl(140,50%,35%)',
  purple: 'hsl(270,55%,45%)',
  orange: 'hsl(28,85%,48%)',
};

function underlineTopOffset(fontSize: number): number {
  return 4 + fontSize * 1.1 + 1;
}

function measureTextWidth(
  text: string,
  fontSize: number,
  fontFamily: string,
  boxWidth: number
): number {
  if (!text) return boxWidth;
  try {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    if (!ctx) return boxWidth;
    ctx.font = `${fontSize}px ${fontFamily}`;
    const lines = text.split('\n');
    const maxLineWidth = Math.max(...lines.map((l) => ctx.measureText(l).width));
    return Math.min(Math.ceil(maxLineWidth) + 16, boxWidth);
  } catch {
    return boxWidth;
  }
}

/**
 * Irregular hand-drawn highlight — same in both interactive and preview mode
 * so the PDF matches what you see on screen.
 */
function HandHighlight({
  color,
  width,
  height,
}: {
  color: string;
  width: number;
  height: number;
}) {
  const fill = HIGHLIGHT_COLORS[color] ?? 'transparent';
  if (!color || color === 'none' || fill === 'transparent') return null;

  const seed = color.charCodeAt(0);
  const wobble = (i: number, amp: number) =>
    Math.sin(i * 3.7 + seed) * amp + Math.cos(i * 2.1 + seed) * amp * 0.5;

  const steps = 12;
  const topPoints: [number, number][] = [];
  const botPoints: [number, number][] = [];
  const topY = height * 0.08;
  const botY = height * 0.92;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = t * width;
    topPoints.push([x + wobble(i, 1.8),     topY + wobble(i + 5, 2.5)]);
    botPoints.push([x + wobble(i + 2, 1.6), botY + wobble(i + 8, 2.2)]);
  }

  const pathD =
    `M ${topPoints[0][0]} ${topPoints[0][1]} ` +
    topPoints.slice(1).map(([x, y]) => `L ${x} ${y}`).join(' ') +
    ' ' +
    botPoints.slice().reverse().map(([x, y]) => `L ${x} ${y}`).join(' ') +
    ' Z';

  return (
    <svg
      aria-hidden
      style={{
        position:      'absolute',
        top:           0,
        left:          0,
        width:         width,
        height:        height,
        overflow:      'visible',
        pointerEvents: 'none',
      }}
    >
      <path d={pathD} fill={fill} />
    </svg>
  );
}

function buildWobblePath(width: number, seed: number): string {
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
  const segments = Math.max(6, Math.floor(width / 18));
  const step     = width / segments;
  const amp      = 2.2;
  let d = `M 0 ${amp + rand() * amp}`;
  for (let i = 1; i <= segments; i++) {
    const x  = i * step;
    const y  = amp + rand() * amp;
    const cx = (i - 0.5) * step;
    const cy = amp * (0.2 + rand() * 1.6);
    d += ` Q ${cx} ${cy} ${x} ${y}`;
  }
  return d;
}

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
        display:       'block',
        overflow:      'visible',
        pointerEvents: 'none',
        marginTop:     '1px',
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

function CssGrid({ mode }: { mode: 'writing' | 'math' }) {
  if (mode === 'writing') {
    const lineSpacing = 24;
    const startY = lineSpacing * 3;
    const lines: number[] = [];
    for (let y = startY; y <= PAPER_HEIGHT; y += lineSpacing) lines.push(y);
    return (
      <>
        {lines.map((y) => (
          <div key={y} style={{ position: 'absolute', left: 0, top: y, width: '100%', height: 0, borderTop: '0.7px solid #9ec8e8', pointerEvents: 'none' }} />
        ))}
        <div style={{ position: 'absolute', top: 0, left: 62, width: 0, height: '100%', borderLeft: '1.2px solid #c0392b', pointerEvents: 'none' }} />
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
        <div key={`v${x}`} style={{ position: 'absolute', top: 0, left: x, width: 0, height: '100%', borderLeft: '0.9px solid #6b7280', pointerEvents: 'none' }} />
      ))}
      {hLines.map((y) => (
        <div key={`h${y}`} style={{ position: 'absolute', left: 0, top: y, width: '100%', height: 0, borderTop: '0.9px solid #6b7280', pointerEvents: 'none' }} />
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
     PREVIEW MODE — used by html-to-image for PDF export
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
          const seed = sticker.instanceId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
          const boxWidth    = sticker.textWidth ?? 180;
          const textSize    = sticker.textSize || 24;
          const textHeight  = textSize * 1.6;

          // Actual text width so highlight + underline end at the text edge
          const actualWidth = measureTextWidth(
            sticker.textContent ?? '',
            textSize,
            sticker.textFont || 'Caveat',
            boxWidth
          );

          const underlineColor = INK_COLORS[
            sticker.textColor?.match(/hsl\((\d+)/)?.[1] === '215' ? 'blue'
            : sticker.textColor?.match(/hsl\((\d+)/)?.[1] === '0'   ? 'red'
            : sticker.textColor?.match(/hsl\((\d+)/)?.[1] === '220' ? 'black'
            : sticker.textColor?.match(/hsl\((\d+)/)?.[1] === '140' ? 'green'
            : 'blue'
          ] ?? sticker.textColor ?? INK_COLORS.blue;

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
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      position:   'relative',
                      padding:    '4px 8px',
                      fontFamily: `'${sticker.textFont || 'Caveat'}', cursive`,
                      fontSize:   `${textSize}px`,
                      color:      sticker.textColor || 'hsl(215,60%,35%)',
                      lineHeight: 1.4,
                      textAlign:  sticker.textAlign || 'center',
                      width:      `${boxWidth}px`,
                      minWidth:   '60px',
                      whiteSpace: 'pre-wrap',
                      wordBreak:  'break-word',
                    }}
                  >
                    {/* Irregular HandHighlight SVG — matches interactive mode exactly */}
                    {sticker.textHighlight && sticker.textHighlight !== 'none' && (
                      <HandHighlight
                        color={sticker.textHighlight}
                        width={actualWidth}
                        height={textHeight}
                      />
                    )}
                    <span style={{ position: 'relative' }}>
                      {sticker.textContent || ''}
                    </span>
                  </div>

                  {sticker.textUnderline && (
                    <div
                      style={{
                        position:      'absolute',
                        left:          0,
                        top:           underlineTopOffset(textSize),
                        pointerEvents: 'none',
                      }}
                    >
                      <WobbleUnderline
                        width={actualWidth}
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
          const seed         = sticker.instanceId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
          const boxWidth     = sticker.textWidth ?? 180;
          const underlineWidth = measureTextWidth(
            sticker.textContent ?? '',
            sticker.textSize || 24,
            sticker.textFont || 'Caveat',
            boxWidth
          );
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
        const hasUnderline   = !!sticker.textUnderline;
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
                minWidth:     '140px',
                width:        sticker.textWidth ? `${sticker.textWidth}px` : '220px',
                fontFamily:   `'${sticker.textFont || 'Caveat'}', cursive`,
                fontSize:     `${sticker.textSize || 24}px`,
                color:        sticker.textColor || 'hsl(215, 60%, 35%)',
                textAlign:    sticker.textAlign || 'center',
                outline:      'none',
                border:       '1.5px solid #bfdbfe',
                borderRadius: '3px',
                boxSizing:    'border-box',
              }}
              maxLength={2000}
            />

            <div
              style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'space-between',
                width:          sticker.textWidth ? `${sticker.textWidth}px` : '220px',
                marginTop:      '3px',
              }}
            >
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
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '5px',
                  padding:      '2px 7px',
                  borderRadius: '5px',
                  border:       `1.5px solid ${hasUnderline ? underlineColor : '#d1d5db'}`,
                  background:   hasUnderline ? `${underlineColor}18` : 'transparent',
                  cursor:       'pointer',
                  userSelect:   'none',
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

              <span style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'sans-serif', lineHeight: 1 }}>
                {editText.length}/2000
              </span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
