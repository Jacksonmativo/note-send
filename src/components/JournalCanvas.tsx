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

const PAPER_WIDTH = 720;
const PAPER_HEIGHT = 1020;

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
  const [editText, setEditText] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
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
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    canvas.width = wrap.clientWidth;
    canvas.height = wrap.clientHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    if (mode === 'writing') {
      ctx.fillStyle = '#fafaf8';
      ctx.fillRect(0, 0, w, h);
      const lineSpacing = 24;
      ctx.strokeStyle = '#9ec8e8';
      ctx.lineWidth = 0.7;
      for (let y = lineSpacing * 3; y <= h; y += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(62, 0);
      ctx.lineTo(62, h);
      ctx.stroke();
    } else {
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
        s.instanceId === editingId
          ? { ...s, textContent: editText.slice(0, 400) }
          : s
      )
    );
    setEditingId(null);
  }, [editingId, editText, setStickers]);

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

  /* ── Preview mode (used by hidden pages for PDF export) ── */
  if (previewMode) {
    return (
      <div
        ref={wrapRef}
        className="relative border border-border bg-white"
        style={{ width: PAPER_WIDTH, height: PAPER_HEIGHT, overflow: 'hidden' }}
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

  /* ── Interactive canvas ── */
  return (
    <div
      ref={wrapRef}
      className="relative border border-border bg-white shadow-lg"
      style={{
        width: PAPER_WIDTH,
        height: PAPER_HEIGHT,
        transform: `scale(${zoom})`,
        transformOrigin: 'top left',
        /* overflow visible so stickers dragged to edges aren't clipped by the canvas div */
        overflow: 'visible',
      }}
    >
      {/* Paper background — clips at the paper boundary */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ borderRadius: 'inherit' }}
      />

      {/* Sticker layer — sits outside clip so items can reach all edges */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: 0,
          overflow: 'visible',
        }}
      >
        {stickersRef.current.map((sticker) => (
          <div key={sticker.instanceId} className="pointer-events-auto">
            <DraggableSticker
              sticker={sticker}
              onUpdate={(updated) =>
                setStickers((prev) =>
                  prev.map((s) =>
                    s.instanceId === updated.instanceId ? updated : s
                  )
                )
              }
              onDelete={(id) =>
                setStickers((prev) => prev.filter((s) => s.instanceId !== id))
              }
              onDoubleClick={
                sticker.textContent !== undefined ? startEdit : undefined
              }
              hidePlaceholder={editingId === sticker.instanceId}
              showTextStretch={sticker.textContent !== undefined}
              showTextResize={sticker.textContent === undefined}
              containerRef={wrapRef}
            />
          </div>
        ))}
      </div>

      {/* Inline text editor */}
      {editingId &&
        (() => {
          const sticker = stickersRef.current.find(
            (s) => s.instanceId === editingId
          );
          if (!sticker) return null;
          return (
            <textarea
              autoFocus
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setEditingId(null);
              }}
              className="absolute bg-transparent p-2 text-sm leading-6 outline-none resize-none"
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
  );
}