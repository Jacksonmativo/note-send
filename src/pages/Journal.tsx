import { useState } from 'react';
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
  const [activeTool, setActiveTool] = useState<ToolId>('text');
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const [backgroundId, setBackgroundId] = useState('notebook');
  const [inkColor, setInkColor] = useState<InkColor>('blue');
  const [fontFamily, setFontFamily] = useState('Caveat');
  const [fontSize, setFontSize] = useState(24);

  const addTextBox = () => {
    const id = `text-${Date.now()}`;
    setStickers((prev) => [
      ...prev,
      {
        instanceId: id,
        stickerId: id,
        textContent: 'New journal note',
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
        x: 60 + Math.random() * 120,
        y: 80 + Math.random() * 140,
        rotation: 0,
        scale: 1,
      },
    ]);
  };

  const handleAddSticker = (sticker: any) => {
    const id = `sticker-${Date.now()}`;
    setStickers((prev) => [
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
    setActiveTool('stickers');
  };

  const handleAddImageSticker = (imageUrl: string) => {
    const id = `image-${Date.now()}`;
    setStickers((prev) => [
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
    setActiveTool('draw');
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

      <main className="flex-1 px-4 py-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="flex flex-wrap gap-3 border-b border-border bg-muted px-4 py-4">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
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

            <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] p-4">
              <aside className="space-y-4">
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
                    <DrawingCanvas
                      onSave={handleAddDrawingSave}
                      onClose={() => setActiveTool('text')}
                    />
                  </div>
                )}
              </aside>

              <div className="flex justify-center overflow-hidden rounded-3xl bg-background p-4">
                <div
                  className="w-full max-w-5xl"
                  style={{ aspectRatio: '210 / 297', minHeight: '75vh', maxHeight: '90vh' }}
                >
                  <JournalCanvas
                    stickers={stickers}
                    onStickersChange={setStickers}
                    backgroundId={backgroundId}
                    onBackgroundChange={setBackgroundId}
                    inkColor={inkColor}
                    fontFamily={fontFamily}
                    fontSize={fontSize}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default JournalPage;
