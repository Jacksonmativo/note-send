import { useState, useRef, useCallback } from 'react';
import { X, RotateCw, Sparkles, MoveHorizontal, Highlighter } from 'lucide-react';

export type StickerLayer = 'image' | 'sticker' | 'text';

export interface PlacedSticker {
  instanceId: string;
  stickerId: string;
  emoji?: string;
  imageUrl?: string;
  textContent?: string;
  textFont?: string;
  textColor?: string;
  textSize?: number;
  textAlign?: 'left' | 'center' | 'right';
  textWidth?: number;
  textHighlight?: string; // e.g. 'yellow' | 'pink' | 'none'
  x: number;
  y: number;
  rotation: number;
  scale: number;
  photoFrame?: string;
  photoFilter?: string;
  photoEffect?: string;
  layer?: StickerLayer;
}

interface DraggableStickerProps {
  sticker: PlacedSticker;
  onUpdate: (updated: PlacedSticker) => void;
  onDelete: (instanceId: string) => void;
  onEffects?: (sticker: PlacedSticker) => void;
  onDoubleClick?: (sticker: PlacedSticker) => void;
  hidePlaceholder?: boolean;
  showTextStretch?: boolean;
  showTextResize?: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}

/* ── Highlight colours cycling ── */
const HIGHLIGHT_CYCLE = ['yellow', 'pink', 'lime', 'none'];

const HIGHLIGHT_CSS: Record<string, string> = {
  yellow: 'rgba(253,224,71,0.55)',
  pink:   'rgba(249,168,212,0.60)',
  lime:   'rgba(163,230,53,0.50)',
  none:   'transparent',
};

/** Renders a hand-drawn-looking highlight behind the text using SVG */
function HandHighlight({ color, width, height }: { color: string; width: number; height: number }) {
  if (!color || color === 'none') return null;
  const fill = HIGHLIGHT_CSS[color] ?? 'transparent';
  if (fill === 'transparent') return null;

  // Build an irregular polygon that looks like a human highlight stroke
  const seed = color.charCodeAt(0); // deterministic wobble per colour
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
    topPoints.push([x + wobble(i, 1.8), topY + wobble(i + 5, 2.5)]);
    botPoints.push([x + wobble(i + 2, 1.6), botY + wobble(i + 8, 2.2)]);
  }

  const pathD =
    `M ${topPoints[0][0]} ${topPoints[0][1]} ` +
    topPoints.slice(1).map(([x, y]) => `L ${x} ${y}`).join(' ') +
    ' ' +
    botPoints
      .slice()
      .reverse()
      .map(([x, y]) => `L ${x} ${y}`)
      .join(' ') +
    ' Z';

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%', overflow: 'visible' }}
      aria-hidden
    >
      <path d={pathD} fill={fill} />
    </svg>
  );
}

const DraggableSticker = ({
  sticker,
  onUpdate,
  onDelete,
  onEffects,
  onDoubleClick,
  hidePlaceholder,
  showTextStretch = false,
  showTextResize = true,
  containerRef,
}: DraggableStickerProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, stickerX: 0, stickerY: 0 });
  const stickerRef = useRef(sticker);
  stickerRef.current = sticker;
  const elemRef = useRef<HTMLDivElement>(null);

  /* ── Free-edge drag helpers ── */
  const clampPos = useCallback(
    (rawX: number, rawY: number) => {
      const container = containerRef.current;
      if (!container) return { x: rawX, y: rawY };
      const rect = container.getBoundingClientRect();
      const elem = elemRef.current;
      // Use the element's own rendered size so items can go right to the edge
      const w = elem ? elem.offsetWidth * sticker.scale : 0;
      const h = elem ? elem.offsetHeight * sticker.scale : 0;
      return {
        x: Math.max(-w * 0.5, Math.min(rect.width - w * 0.5, rawX)),
        y: Math.max(-h * 0.5, Math.min(rect.height - h * 0.5, rawY)),
      };
    },
    [containerRef, sticker.scale]
  );

  /* ── Mouse drag ── */
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        stickerX: sticker.x,
        stickerY: sticker.y,
      };

      const handleMouseMove = (e: MouseEvent) => {
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        const { x, y } = clampPos(
          dragStart.current.stickerX + dx,
          dragStart.current.stickerY + dy
        );
        onUpdate({ ...stickerRef.current, x, y });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [sticker.x, sticker.y, onUpdate, clampPos]
  );

  /* ── Touch drag ── */
  const lastTouchTimeRef = useRef<number>(0);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      const now = Date.now();
      if (now - lastTouchTimeRef.current < 300) {
        e.preventDefault();
        lastTouchTimeRef.current = 0;
        if (onDoubleClick) onDoubleClick(sticker);
        return;
      }
      lastTouchTimeRef.current = now;
      const touch = e.touches[0];
      setIsDragging(true);
      dragStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        stickerX: sticker.x,
        stickerY: sticker.y,
      };

      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        const t = e.touches[0];
        const dx = t.clientX - dragStart.current.x;
        const dy = t.clientY - dragStart.current.y;
        const { x, y } = clampPos(
          dragStart.current.stickerX + dx,
          dragStart.current.stickerY + dy
        );
        onUpdate({ ...stickerRef.current, x, y });
      };

      const handleTouchEnd = () => {
        setIsDragging(false);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };

      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    },
    [sticker, onUpdate, onDoubleClick, clampPos]
  );

  /* ── Controls ── */
  const rotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({ ...sticker, rotation: sticker.rotation + 15 });
  };

  const cycleHighlight = (e: React.MouseEvent) => {
    e.stopPropagation();
    const current = sticker.textHighlight ?? 'none';
    const nextIdx = (HIGHLIGHT_CYCLE.indexOf(current) + 1) % HIGHLIGHT_CYCLE.length;
    onUpdate({ ...sticker, textHighlight: HIGHLIGHT_CYCLE[nextIdx] });
  };

  /* ── Scale resize ── */
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startScale = sticker.scale;
      const handleMouseMove = (e: MouseEvent) => {
        const dx = e.clientX - startX;
        const newScale = Math.max(0.3, Math.min(3, startScale + dx / 100));
        onUpdate({ ...stickerRef.current, scale: newScale });
      };
      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [sticker.scale, onUpdate]
  );

  const handleResizeTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      const startX = e.touches[0].clientX;
      const startScale = sticker.scale;
      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        const dx = e.touches[0].clientX - startX;
        const newScale = Math.max(0.3, Math.min(3, startScale + dx / 100));
        onUpdate({ ...stickerRef.current, scale: newScale });
      };
      const handleTouchEnd = () => {
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    },
    [sticker.scale, onUpdate]
  );

  /* ── Text width stretch ── */
  const handleStretchMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startWidth = sticker.textWidth ?? 180;
      const container = containerRef.current;
      const maxWidth = container
        ? Math.max(120, container.getBoundingClientRect().width - sticker.x - 20)
        : 1000;
      const handleMouseMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - startX;
        const width = Math.max(100, Math.min(maxWidth, startWidth + dx * 0.6));
        onUpdate({ ...stickerRef.current, textWidth: width });
      };
      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [sticker, onUpdate, containerRef]
  );

  const handleStretchTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      const startX = e.touches[0].clientX;
      const startWidth = sticker.textWidth ?? 180;
      const container = containerRef.current;
      const maxWidth = container
        ? Math.max(120, container.getBoundingClientRect().width - sticker.x - 20)
        : 1000;
      const handleTouchMove = (moveEvent: TouchEvent) => {
        moveEvent.preventDefault();
        const dx = moveEvent.touches[0].clientX - startX;
        const width = Math.max(100, Math.min(maxWidth, startWidth + dx * 0.6));
        onUpdate({ ...stickerRef.current, textWidth: width });
      };
      const handleTouchEnd = () => {
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    },
    [sticker, onUpdate, containerRef]
  );

  /* ── Deselect on outside click ── */
  const handleClickOutside = useCallback(
    (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`[data-sticker-id="${sticker.instanceId}"]`)) {
        setIsSelected(false);
        window.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('touchstart', handleClickOutside);
      }
    },
    [sticker.instanceId]
  );

  const handleSelect = useCallback(() => {
    setIsSelected(true);
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('touchstart', handleClickOutside);
  }, [handleClickOutside]);

  const showControls = isSelected && !isDragging;
  const hlColor = sticker.textHighlight ?? 'none';

  /* ── Derived text box dimensions for the SVG highlight ── */
  const textBoxWidth = sticker.textWidth ?? 180;
  // Approx line-height × lines; SVG fills the full div height anyway
  const textBoxHeight = (sticker.textSize ?? 24) * 1.6;

  return (
    <div
      ref={elemRef}
      data-sticker-id={sticker.instanceId}
      className="absolute select-none group"
      style={{
        left: sticker.x,
        top: sticker.y,
        transform: `rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 50 : isSelected ? 20 : 10,
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (onDoubleClick) onDoubleClick(sticker);
      }}
      onTouchStart={handleTouchStart}
      onClick={handleSelect}
    >
      {sticker.textContent !== undefined ? (
        <div className="relative px-2 py-1 select-none pointer-events-none whitespace-pre-wrap break-words"
          style={{
            fontFamily: `'${sticker.textFont || 'Caveat'}', cursive`,
            fontSize: `${sticker.textSize || 24}px`,
            color: sticker.textColor || 'hsl(215, 60%, 35%)',
            lineHeight: '1.4',
            textAlign: sticker.textAlign || 'center',
            width: sticker.textWidth ? `${sticker.textWidth}px` : '180px',
            minWidth: '60px',
          }}
        >
          {/* Hand-drawn highlight rendered behind text */}
          <HandHighlight
            color={hlColor}
            width={textBoxWidth}
            height={textBoxHeight}
          />
          <span className="relative">{hidePlaceholder ? '' : (sticker.textContent || 'Double-click to edit')}</span>
        </div>
      ) : sticker.imageUrl ? (
        <div className={`relative photo-frame-${sticker.photoFrame || 'none'}`}>
          <img
            src={sticker.imageUrl}
            alt="sticker"
            className="w-24 h-24 object-contain sticker-shadow select-none pointer-events-none"
            style={{ filter: sticker.photoFilter || 'none' }}
            draggable={false}
          />
          {sticker.photoEffect && sticker.photoEffect !== 'none' && (
            <div className={`absolute inset-0 pointer-events-none photo-effect-${sticker.photoEffect}`} />
          )}
        </div>
      ) : (
        <span
          className="text-4xl select-none pointer-events-none"
          style={{
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.18))',
            WebkitTextStroke: '3px white',
            paintOrder: 'stroke fill',
          }}
        >
          {sticker.emoji}
        </span>
      )}

      {showControls && (
        <>
          {/* Delete */}
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDelete(sticker.instanceId); }}
            className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-destructive flex items-center justify-center text-destructive-foreground shadow-md active:scale-90 transition-transform"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Photo effects */}
          {sticker.imageUrl && onEffects && (
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onEffects(sticker); }}
              className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-card flex items-center justify-center text-foreground shadow-md active:scale-90 transition-transform border border-border"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Highlight cycle button — only for text stickers */}
          {sticker.textContent !== undefined && (
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={cycleHighlight}
              title="Cycle highlight colour"
              className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-card flex items-center justify-center shadow-md active:scale-90 transition-transform border border-border"
              style={{
                background:
                  hlColor !== 'none' ? HIGHLIGHT_CSS[hlColor] : undefined,
              }}
            >
              <Highlighter className="w-3.5 h-3.5 text-foreground" />
            </button>
          )}

          {/* Text width stretch handle */}
          {sticker.textContent !== undefined && showTextStretch && (
            <button
              onMouseDown={handleStretchMouseDown}
              onTouchStart={handleStretchTouchStart}
              className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-secondary/95 border border-border flex items-center justify-center text-secondary-foreground shadow-md active:scale-95 transition-transform cursor-ew-resize"
              title="Drag to stretch text box horizontally"
            >
              <MoveHorizontal className="w-4 h-4" />
            </button>
          )}

          {/* Rotate */}
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={rotate}
            className="absolute -bottom-3 -right-3 w-7 h-7 rounded-full bg-accent flex items-center justify-center text-accent-foreground shadow-md active:scale-90 transition-transform"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Scale resize handle */}
          {showTextResize && (
            <div
              onMouseDown={handleResizeMouseDown}
              onTouchStart={handleResizeTouchStart}
              className="absolute -bottom-3 -left-3 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-md cursor-nwse-resize active:scale-90 transition-transform"
              title="Drag to resize"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 7H13M1 7L4 4M1 7L4 10M13 7L10 4M13 7L10 10" />
              </svg>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DraggableSticker;