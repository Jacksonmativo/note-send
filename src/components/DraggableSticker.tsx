import { useState, useRef, useCallback } from 'react';
import { X, RotateCw, Sparkles } from 'lucide-react';

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
  containerRef: React.RefObject<HTMLDivElement>;
}

const DraggableSticker = ({ sticker, onUpdate, onDelete, onEffects, containerRef }: DraggableStickerProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, stickerX: 0, stickerY: 0 });
  const stickerRef = useRef(sticker);
  stickerRef.current = sticker;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
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
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      const newX = Math.max(0, Math.min(rect.width - 40, dragStart.current.stickerX + dx));
      const newY = Math.max(0, Math.min(rect.height - 40, dragStart.current.stickerY + dy));
      onUpdate({ ...sticker, x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [sticker, onUpdate, containerRef]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
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
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const touch = e.touches[0];
      const dx = touch.clientX - dragStart.current.x;
      const dy = touch.clientY - dragStart.current.y;
      const newX = Math.max(0, Math.min(rect.width - 40, dragStart.current.stickerX + dx));
      const newY = Math.max(0, Math.min(rect.height - 40, dragStart.current.stickerY + dy));
      onUpdate({ ...sticker, x: newX, y: newY });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
  }, [sticker, onUpdate, containerRef]);

  const rotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({ ...sticker, rotation: sticker.rotation + 15 });
  };

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startScale = sticker.scale;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startX;
      const newScale = Math.max(0.3, Math.min(3, startScale + dx / 100));
      onUpdate({ ...sticker, scale: newScale });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [sticker, onUpdate]);

  const handleResizeTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    const startX = e.touches[0].clientX;
    const startScale = sticker.scale;

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const dx = e.touches[0].clientX - startX;
      const newScale = Math.max(0.3, Math.min(3, startScale + dx / 100));
      onUpdate({ ...sticker, scale: newScale });
    };

    const handleTouchEnd = () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
  }, [sticker, onUpdate]);

  // Deselect when clicking outside
  const handleClickOutside = useCallback((e: MouseEvent | TouchEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest(`[data-sticker-id="${sticker.instanceId}"]`)) {
      setIsSelected(false);
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('touchstart', handleClickOutside);
    }
  }, [sticker.instanceId]);

  const handleSelect = useCallback(() => {
    setIsSelected(true);
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('touchstart', handleClickOutside);
  }, [handleClickOutside]);

  const showControls = isSelected && !isDragging;

  return (
    <div
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
      onTouchStart={handleTouchStart}
      onClick={handleSelect}
    >
      {sticker.textContent !== undefined ? (
        <div
          className="min-w-[60px] max-w-[220px] px-2 py-1 select-none pointer-events-none whitespace-pre-wrap break-words flex items-center justify-center text-center"
          style={{
            fontFamily: `'${sticker.textFont || 'Caveat'}', cursive`,
            fontSize: `${sticker.textSize || 24}px`,
            color: sticker.textColor || 'hsl(215, 60%, 35%)',
            lineHeight: '1.4',
          }}
        >
          {sticker.textContent || 'Double-click to edit'}
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
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onDelete(sticker.instanceId); }}
            className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-destructive flex items-center justify-center text-destructive-foreground shadow-md active:scale-90 transition-transform"
          >
            <X className="w-4 h-4" />
          </button>
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
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={rotate}
            className="absolute -bottom-3 -right-3 w-7 h-7 rounded-full bg-accent flex items-center justify-center text-accent-foreground shadow-md active:scale-90 transition-transform"
          >
            <RotateCw className="w-4 h-4" />
          </button>
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
        </>
      )}
    </div>
  );
};

export default DraggableSticker;
