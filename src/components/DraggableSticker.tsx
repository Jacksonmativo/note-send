import { useState, useRef, useCallback } from 'react';
import { X, RotateCw } from 'lucide-react';

export interface PlacedSticker {
  instanceId: string;
  stickerId: string;
  emoji?: string;
  imageUrl?: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

interface DraggableStickerProps {
  sticker: PlacedSticker;
  onUpdate: (updated: PlacedSticker) => void;
  onDelete: (instanceId: string) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

const DraggableSticker = ({ sticker, onUpdate, onDelete, containerRef }: DraggableStickerProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, stickerX: 0, stickerY: 0 });

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

  return (
    <div
      className="absolute select-none group"
      style={{
        left: sticker.x,
        top: sticker.y,
        transform: `rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 50 : 10,
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {sticker.imageUrl ? (
        <img
          src={sticker.imageUrl}
          alt="sticker"
          className="w-16 h-16 object-contain sticker-shadow select-none pointer-events-none"
          draggable={false}
        />
      ) : (
        <span className="text-4xl sticker-shadow select-none pointer-events-none">
          {sticker.emoji}
        </span>
      )}
      {isHovered && !isDragging && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(sticker.instanceId); }}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive flex items-center justify-center text-destructive-foreground opacity-80 hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
          <button
            onClick={rotate}
            className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center text-accent-foreground opacity-80 hover:opacity-100 transition-opacity"
          >
            <RotateCw className="w-3 h-3" />
          </button>
          <div
            onMouseDown={handleResizeMouseDown}
            onTouchStart={handleResizeTouchStart}
            className="absolute -bottom-2 -left-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground opacity-80 hover:opacity-100 transition-opacity cursor-nwse-resize"
            title="Drag to resize"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M1 9L9 1M4 9L9 4M7 9L9 7" />
            </svg>
          </div>
        </>
      )}
    </div>
  );
};

export default DraggableSticker;
