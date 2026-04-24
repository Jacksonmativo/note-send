import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileSignature,
  ImageIcon,
  Pencil,
  TextCursorInput,
  Sticker,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import JournalCanvas from '@/components/JournalCanvas';
import TextControls from '@/components/TextControls';
import StickerPanel from '@/components/StickerPanel';
import ImageUploadPanel from '@/components/ImageUploadPanel';
import DrawingCanvas from '@/components/DrawingCanvas';
import type { PlacedSticker } from '@/components/DraggableSticker';
import type { InkColor } from '@/components/StickerData';

const tools = [
  { id: 'text', label: 'Text', icon: TextCursorInput },
  { id: 'stickers', label: 'Stickers', icon: Sticker },
  { id: 'upload', label: 'Upload', icon: ImageIcon },
  { id: 'draw', label: 'Draw', icon: Pencil },
] as const;

type ToolId = (typeof tools)[number]['id'];

const JournalPage = () => {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pages, setPages] = useState<Array<{ id: string; stickers: PlacedSticker[] }>>([
    { id: 'page-1', stickers: [] },
  ]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [backgroundId, setBackgroundId] = useState('notebook');
  const [inkColor, setInkColor] = useState<InkColor>('blue');
  const [fontFamily, setFontFamily] = useState('Caveat');
  const [fontSize, setFontSize] = useState(24);

  const currentPage = pages[currentPageIndex];
  const hiddenPageRefs = useRef<Array<HTMLDivElement | null>>([]);

  const downloadAllPages = useCallback(async () => {
    if (pages.length === 0) return;

    const images: string[] = [];

    for (let index = 0; index < pages.length; index += 1) {
      const pageNode = hiddenPageRefs.current[index];
      if (!pageNode) continue;

      const imageData = await toPng(pageNode, {
        cacheBust: true,
        backgroundColor: '#ffffff',
      });
      images.push(imageData);
    }

    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const a4Width = 210;
    const a4Height = 297;

    images.forEach((image, index) => {
      if (index > 0) pdf.addPage();
      pdf.addImage(image, 'PNG', 0, 0, a4Width, a4Height);
    });

    pdf.save(`journal-${Date.now()}.pdf`);
  }, [pages]);

  const updateCurrentPageStickers = (updater: PlacedSticker[] | ((prev: PlacedSticker[]) => PlacedSticker[])) => {
    setPages((prev) =>
      prev.map((page, index) =>
        index === currentPageIndex
          ? {
              ...page,
              stickers: typeof updater === 'function' ? updater(page.stickers) : updater,
            }
          : page
      )
    );
  };

  const createNewPage = () => {
    setPages((prev) => [
      ...prev,
      {
        id: `page-${prev.length + 1}-${Date.now()}`,
        stickers: [],
      },
    ]);
    setCurrentPageIndex((prev) => prev + 1);
  };

  const goToPage = (index: number) => {
    if (index < 0 || index >= pages.length) return;
    setCurrentPageIndex(index);
    setActiveTool(null);
  };

  const addTextBox = () => {
    const id = `text-${Date.now()}`;
    const placeholder = 'Double-click to edit';
    let defaultWidth = 280;

    if (typeof window !== 'undefined') {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
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
          inkColor === 'blue'
            ? 'hsl(215, 60%, 35%)'
            : inkColor === 'black'
            ? 'hsl(220, 20%, 15%)'
            : inkColor === 'red'
            ? 'hsl(0, 70%, 50%)'
            : 'hsl(140, 50%, 45%)',
        textSize: fontSize,
        textAlign: 'left',
        textWidth: defaultWidth,
        x: 60,
        y: 80 + Math.random() * 140,
        rotation: 0,
        scale: 1,
      },
    ]);
    setActiveTool('stickers');
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-card border-b border-border px-4 py-3"
      >
        <div className="max-w-5xl mx-auto flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground shadow-sm hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Notes
            </Link>
            <div>
              <h1 className="text-lg font-heading font-semibold text-foreground">
                Journal Workspace
              </h1>
              <p className="text-sm text-muted-foreground">
                Write, draw, and add stickers for maths or exercise journaling.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm">
              <button
                type="button"
                onClick={() => goToPage(currentPageIndex - 1)}
                disabled={currentPageIndex === 0}
                className="rounded-full px-2 py-1 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:bg-muted"
              >
                Prev
              </button>
              <span className="text-sm">
                Page {currentPageIndex + 1} of {pages.length}
              </span>
              <button
                type="button"
                onClick={() => goToPage(currentPageIndex + 1)}
                disabled={currentPageIndex === pages.length - 1}
                className="rounded-full px-2 py-1 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:bg-muted"
              >
                Next
              </button>
            </div>
            <button
              onClick={createNewPage}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted transition-colors"
            >
              Add Page
            </button>
            <Link
              to="/sign"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              <FileSignature className="w-4 h-4" />
              Sign a Document
            </Link>
          </div>
        </div>
      </motion.header>

      <main className="flex-1 px-4 py-6 pb-28">
        <div className="max-w-6xl mx-auto space-y-6">
          <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="flex flex-wrap gap-3 border-b border-border bg-muted px-4 py-4">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool((prev) => (prev === tool.id ? null : tool.id))}
                    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
                      activeTool === tool.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/80'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tool.label}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center overflow-hidden rounded-3xl bg-background p-4">
              <div
                className="w-full max-w-5xl"
                style={{ aspectRatio: '210 / 297', minHeight: '75vh', maxHeight: '90vh' }}
              >
                <JournalCanvas
                  stickers={currentPage.stickers}
                  onStickersChange={updateCurrentPageStickers}
                  backgroundId={backgroundId}
                  onBackgroundChange={setBackgroundId}
                  inkColor={inkColor}
                  fontFamily={fontFamily}
                  fontSize={fontSize}
                  onDownloadAllPages={downloadAllPages}
                />
              </div>
            </div>

            <div className="pointer-events-none opacity-0 fixed left-[-9999px] top-0">
              {pages.map((page, index) => (
                <div
                  key={page.id}
                  ref={(el) => {
                    hiddenPageRefs.current[index] = el;
                  }}
                  style={{ width: 720, height: 1020 }}
                >
                  <JournalCanvas
                    stickers={page.stickers}
                    backgroundId={backgroundId}
                    inkColor={inkColor}
                    fontFamily={fontFamily}
                    fontSize={fontSize}
                    previewMode
                  />
                </div>
              ))}
            </div>

            {activeTool && (
              <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card shadow-xl">
                <div className="max-w-6xl mx-auto px-4 py-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      {activeTool === 'text' && (
                        <div className="rounded-3xl border border-border bg-background p-4">
                          <div className="mb-4 text-sm font-medium text-foreground">Add journal text</div>
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
                            className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                          >
                            Add Text Box
                          </button>
                        </div>
                      )}

                      {activeTool === 'stickers' && (
                        <div className="rounded-3xl border border-border bg-background p-4">
                          <div className="mb-4 text-sm font-medium text-foreground">Pick a sticker</div>
                          <StickerPanel onAddSticker={handleAddSticker} />
                        </div>
                      )}

                      {activeTool === 'upload' && (
                        <div className="rounded-3xl border border-border bg-background p-4">
                          <div className="mb-4 text-sm font-medium text-foreground">Upload an image</div>
                          <ImageUploadPanel onAddImageSticker={handleAddImageSticker} />
                        </div>
                      )}

                      {activeTool === 'draw' && (
                        <div className="rounded-3xl border border-border bg-background p-4">
                          <div className="mb-4 text-sm font-medium text-foreground">Draw and save to journal</div>
                          <button
                            onClick={() => setIsDrawing(true)}
                            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                          >
                            Open Drawing Canvas
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 md:pl-4">
                      <button
                        onClick={() => setActiveTool(null)}
                        className="rounded-2xl border border-border bg-muted px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/90 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          {isDrawing && (
            <DrawingCanvas
              onSave={handleAddDrawingSave}
              onClose={() => setIsDrawing(false)}
            />
          )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default JournalPage;
