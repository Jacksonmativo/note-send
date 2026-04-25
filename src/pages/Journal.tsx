import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileSignature,
  ImageIcon,
  Pencil,
  TextCursorInput,
  Sticker,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import JournalCanvas from '@/components/JournalCanvas';
import TextControls from '@/components/TextControls';
import StickerPanel from '@/components/StickerPanel';
import ImageUploadPanel from '@/components/ImageUploadPanel';
import DrawingCanvas from '@/components/DrawingCanvas';
import CoffeePopup from '@/components/CoffeePopup';
import type { PlacedSticker } from '@/components/DraggableSticker';
import type { InkColor } from '@/components/StickerData';

/* ─── Constants ─────────────────────────────────────────── */
const PAPER_WIDTH = 720;
const PAPER_HEIGHT = 1020;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 1.8;
const ZOOM_STEP = 0.05;

const tools = [
  { id: 'text',     label: 'Text',     icon: TextCursorInput },
  { id: 'stickers', label: 'Stickers', icon: Sticker },
  { id: 'upload',   label: 'Upload',   icon: ImageIcon },
  { id: 'draw',     label: 'Draw',     icon: Pencil },
] as const;

type ToolId = (typeof tools)[number]['id'];

/* ─── Component ─────────────────────────────────────────── */
const JournalPage = () => {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [isDrawing, setIsDrawing]   = useState(false);
  const [mode, setMode]             = useState<'writing' | 'math'>('writing');
  const [zoom, setZoom]             = useState(1);
  const [showCoffeePopup, setShowCoffeePopup] = useState(false);

  const [pages, setPages] = useState<Array<{ id: string; stickers: PlacedSticker[] }>>([
    { id: 'page-1', stickers: [] },
  ]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const [backgroundId, setBackgroundId] = useState('notebook');
  const [inkColor, setInkColor]         = useState<InkColor>('blue');
  const [fontFamily, setFontFamily]     = useState('Caveat');
  const [fontSize, setFontSize]         = useState(24);

  const hiddenPageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const currentPage    = pages[currentPageIndex];

  /* ── Auto-fit zoom on mobile ────────────────────────── */
  useEffect(() => {
    const updateZoom = () => {
      const w = window.innerWidth;
      if (w < 768) {
        // leave 16px padding each side
        setZoom(Math.max(MIN_ZOOM, (w - 32) / PAPER_WIDTH));
      } else {
        setZoom(1);
      }
    };
    updateZoom();
    window.addEventListener('resize', updateZoom);
    return () => window.removeEventListener('resize', updateZoom);
  }, []);

  /* ── PDF export ─────────────────────────────────────── */
  const downloadAllPages = useCallback(async () => {
    const images: string[] = [];
    for (let i = 0; i < pages.length; i++) {
      const node = hiddenPageRefs.current[i];
      if (!node) continue;
      const img = await toPng(node, {
        quality: 1,
        pixelRatio: 2,
        skipAutoScale: true,
        cacheBust: true,
        backgroundColor: '#ffffff',
      });
      images.push(img);
    }
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    images.forEach((image, i) => {
      if (i > 0) pdf.addPage();
      pdf.addImage(image, 'PNG', 0, 0, 210, 297);
    });
    pdf.save(`journal-${Date.now()}.pdf`);
    setShowCoffeePopup(true);
  }, [pages]);

  /* ── Page management ────────────────────────────────── */
  const updateCurrentPageStickers = useCallback(
    (updater: PlacedSticker[] | ((prev: PlacedSticker[]) => PlacedSticker[])) => {
      setPages((prev) =>
        prev.map((page, idx) =>
          idx === currentPageIndex
            ? {
                ...page,
                stickers:
                  typeof updater === 'function'
                    ? updater(page.stickers)
                    : updater,
              }
            : page
        )
      );
    },
    [currentPageIndex]
  );

  const createNewPage = () => {
    setPages((prev) => [
      ...prev,
      { id: `page-${prev.length + 1}-${Date.now()}`, stickers: [] },
    ]);
    setCurrentPageIndex((prev) => prev + 1);
  };

  const goToPage = (index: number) => {
    if (index < 0 || index >= pages.length) return;
    setCurrentPageIndex(index);
    setActiveTool(null);
  };

  /* ── Add sticker / text ─────────────────────────────── */
  const addTextBox = () => {
    const id = `text-${Date.now()}`;
    const placeholder = 'Double-click to edit';
    let defaultWidth = 280;
    if (typeof window !== 'undefined') {
      const c = document.createElement('canvas');
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.font = `${fontSize}px ${fontFamily}`;
        defaultWidth = Math.ceil(ctx.measureText(placeholder).width + 24);
      }
    }
    updateCurrentPageStickers((prev) => [
      ...prev,
      {
        instanceId: id,
        stickerId: id,
        textContent: '',
        textFont: fontFamily,
        textColor:
          inkColor === 'blue'  ? 'hsl(215, 60%, 35%)' :
          inkColor === 'black' ? 'hsl(220, 20%, 15%)' :
          inkColor === 'red'   ? 'hsl(0, 70%, 50%)'   :
                                 'hsl(140, 50%, 45%)',
        textSize: fontSize,
        textAlign: 'left',
        textWidth: defaultWidth,
        x: 60,
        y: 80 + Math.random() * 140,
        rotation: 0,
        scale: 1,
      },
    ]);
    setActiveTool(null);
  };

  const handleAddSticker = (sticker: { id: string; emoji?: string; image?: string }) => {
    const id = `sticker-${Date.now()}`;
    updateCurrentPageStickers((prev) => [
      ...prev,
      {
        instanceId: id,
        stickerId: sticker.id,
        emoji: sticker.emoji,
        imageUrl: sticker.image,
        x: 50 + Math.random() * 220,
        y: 70 + Math.random() * 240,
        rotation: 0,
        scale: 1,
      },
    ]);
  };

  const handleAddImageSticker = (imageUrl: string) => {
    const id = `image-${Date.now()}`;
    updateCurrentPageStickers((prev) => [
      ...prev,
      {
        instanceId: id,
        stickerId: 'image',
        imageUrl,
        x: 50 + Math.random() * 220,
        y: 70 + Math.random() * 240,
        rotation: 0,
        scale: 1,
      },
    ]);
  };

  const handleAddDrawingSave = (dataUrl: string) => {
    handleAddImageSticker(dataUrl);
    setIsDrawing(false);
    setActiveTool(null);
  };

  /* ─────────────────────────────────────────────────────
     Layout
     h-screen → fixed viewport height, no page scroll
     flex-col  → stack header / mode-bar / canvas / (fixed bottom)
  ───────────────────────────────────────────────────── */
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">

      {/* ══ 1. Header ══════════════════════════════════════════ */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="shrink-0 bg-card border-b border-border px-3 py-2 z-10"
      >
        <div className="flex items-center justify-between gap-2">
          {/* Left: back + title */}
          <div className="flex items-center gap-2 min-w-0">
            <Link
              to="/"
              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5
                         text-sm font-medium text-foreground hover:bg-muted transition-colors shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <h1 className="text-sm sm:text-base font-semibold text-foreground truncate">
              Journal Workspace
            </h1>
          </div>

          {/* Right: page nav + add page + sign */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center rounded-full border border-border bg-background">
              <button
                onClick={() => goToPage(currentPageIndex - 1)}
                disabled={currentPageIndex === 0}
                className="p-1.5 rounded-full hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-xs font-medium">
                {currentPageIndex + 1}/{pages.length}
              </span>
              <button
                onClick={() => goToPage(currentPageIndex + 1)}
                disabled={currentPageIndex === pages.length - 1}
                className="p-1.5 rounded-full hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={createNewPage}
              className="rounded-lg border border-border bg-background px-2.5 py-1.5
                         text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              + Page
            </button>

            <Link
              to="/sign"
              className="hidden sm:flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5
                         text-xs font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              <FileSignature className="w-3.5 h-3.5" />
              Sign Doc
            </Link>
          </div>
        </div>
      </motion.header>

      {/* ══ 2. Mode + Zoom card  ═══════════════════════════════
              Lives ABOVE the tool bar, BELOW the header           */}
      <div className="shrink-0 bg-card border-b border-border px-3 py-2 flex items-center justify-between gap-3 z-10">
        {/* Mode label + switch */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold truncate">
            {mode === 'math' ? '∑ Maths Journal' : '✎ Writing Journal'}
          </span>
          <button
            onClick={() => setMode((m) => (m === 'math' ? 'writing' : 'math'))}
            className="shrink-0 rounded-full bg-accent text-accent-foreground px-3 py-1
                       text-xs font-medium hover:bg-accent/90 transition-colors"
          >
            {mode === 'math' ? '✎ Writing' : '∑ Maths'}
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1 rounded-full border border-border bg-background px-1.5 py-1 shrink-0">
          <button
            onClick={() =>
              setZoom((z) => Math.max(MIN_ZOOM, parseFloat((z - ZOOM_STEP).toFixed(2))))
            }
            className="w-6 h-6 flex items-center justify-center rounded-full
                       hover:bg-muted text-base font-medium transition-colors"
          >
            −
          </button>
          <span className="w-10 text-center text-xs font-medium tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() =>
              setZoom((z) => Math.min(MAX_ZOOM, parseFloat((z + ZOOM_STEP).toFixed(2))))
            }
            className="w-6 h-6 flex items-center justify-center rounded-full
                       hover:bg-muted text-base font-medium transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* ══ 3. Canvas area ═════════════════════════════════════ */}
      <main
        className="flex-1 min-h-0 overflow-auto bg-slate-100/50"
        /* pad bottom to never hide behind fixed toolbar + panel */
        style={{ paddingBottom: activeTool ? '300px' : '76px' }}
      >
        <div className="p-3 sm:p-5">
          {/*
            Outer div reserves the SCALED dimensions in document flow,
            so scroll area matches the actual visible canvas size.
          */}
          <div
            className="mx-auto"
            style={{
              width:  PAPER_WIDTH  * zoom,
              height: PAPER_HEIGHT * zoom,
            }}
          >
            <JournalCanvas
              stickers={currentPage.stickers}
              onStickersChange={updateCurrentPageStickers}
              backgroundId={backgroundId}
              inkColor={inkColor}
              fontFamily={fontFamily}
              fontSize={fontSize}
              zoom={zoom}
              mode={mode}
            />
          </div>
        </div>
      </main>

      {/* ══ Hidden pages for multi-page PDF export ════════════ */}
      <div aria-hidden className="sr-only">
        {pages.map((page, index) => (
          <div
            key={page.id}
            ref={(el) => { hiddenPageRefs.current[index] = el; }}
            style={{
              position: 'absolute',
              left: -9999,
              top: 0,
              width: PAPER_WIDTH,
              height: PAPER_HEIGHT,
            }}
          >
            <JournalCanvas
              stickers={page.stickers}
              backgroundId={backgroundId}
              inkColor={inkColor}
              fontFamily={fontFamily}
              fontSize={fontSize}
              zoom={1}
              mode={mode}
              previewMode
            />
          </div>
        ))}
      </div>

      {/* ══ 4. Fixed bottom: tool panel + toolbar ═════════════ */}
      <div className="fixed bottom-0 inset-x-0 z-40">

        {/* Tool panel — slides up when a tool is active */}
        <AnimatePresence>
          {activeTool && (
            <motion.div
              key="tool-panel"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0,      opacity: 1 }}
              exit={{   y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="bg-card border-t border-border shadow-2xl overflow-y-auto"
              style={{ maxHeight: '44vh' }}
            >
              {/* Close row */}
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {activeTool === 'text'     && 'Add journal text'}
                  {activeTool === 'stickers' && 'Pick a sticker'}
                  {activeTool === 'upload'   && 'Upload an image'}
                  {activeTool === 'draw'     && 'Draw on canvas'}
                </p>
                <button
                  onClick={() => setActiveTool(null)}
                  className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-4 pb-4">
                {activeTool === 'text' && (
                  <div className="space-y-3">
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
                      className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium
                                 text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Add Text Box to Journal
                    </button>
                  </div>
                )}

                {activeTool === 'stickers' && (
                  <StickerPanel onAddSticker={handleAddSticker} />
                )}

                {activeTool === 'upload' && (
                  <ImageUploadPanel onAddImageSticker={handleAddImageSticker} />
                )}

                {activeTool === 'draw' && (
                  <button
                    onClick={() => setIsDrawing(true)}
                    className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium
                               text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Open Drawing Canvas
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Toolbar ───────────────────────────────────────── */}
        <div className="bg-card border-t border-border">
          <div className="max-w-xl mx-auto px-2 py-1.5 flex items-stretch gap-1">
            {tools.map((tool) => {
              const Icon     = tool.icon;
              const isActive = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() =>
                    setActiveTool((prev) => (prev === tool.id ? null : tool.id))
                  }
                  className={`
                    flex-1 flex flex-col items-center justify-center gap-0.5
                    rounded-2xl px-2 py-2 text-xs font-medium transition-colors
                    ${isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'}
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="leading-tight">{tool.label}</span>
                </button>
              );
            })}

            {/* Divider */}
            <div className="w-px bg-border my-2 shrink-0" />

            {/* Download PDF — in toolbar */}
            <button
              onClick={downloadAllPages}
              className="flex-1 flex flex-col items-center justify-center gap-0.5
                         rounded-2xl px-2 py-2 text-xs font-medium
                         text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Download className="w-5 h-5" />
              <span className="leading-tight">PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Drawing overlay */}
      {isDrawing && (
        <DrawingCanvas
          onSave={handleAddDrawingSave}
          onClose={() => setIsDrawing(false)}
        />
      )}

      {/* Coffee Popup */}
      <CoffeePopup isOpen={showCoffeePopup} onClose={() => setShowCoffeePopup(false)} />
    </div>
  );
};

export default JournalPage;