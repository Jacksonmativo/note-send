import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import TextControls from './TextControls';
import BackgroundSelector from './BackgroundSelector';
import StickerPanel from './StickerPanel';
import ImageUploadPanel from './ImageUploadPanel';
import DrawingCanvas from './DrawingCanvas';
import JournalCanvas from './JournalCanvas';
import type { InkColor } from './StickerData';

interface ToolPanelProps {
  activeTool: string | null;
  onClose: () => void;
  // Text controls props
  inkColor: InkColor;
  fontFamily: string;
  fontSize: number;
  onInkChange: (color: InkColor) => void;
  onFontChange: (font: string) => void;
  onSizeChange: (size: number) => void;
  onAddTextBox: () => void;
  // Background props
  backgroundId: string;
  onBackgroundChange: (id: string) => void;
  // Sticker props
  stickers: any[];
  onStickersChange: (stickers: any[]) => void;
  onAddSticker: (sticker: any) => void;
  // Upload props
  onAddImageSticker: (url: string) => void;
  // Draw props
  onDrawingSave: (dataUrl: string) => void;
}

export default function ToolPanel({
  activeTool,
  onClose,
  inkColor,
  fontFamily,
  fontSize,
  onInkChange,
  onFontChange,
  onSizeChange,
  onAddTextBox,
  backgroundId,
  onBackgroundChange,
  stickers,
  onStickersChange,
  onAddSticker,
  onAddImageSticker,
  onDrawingSave,
}: ToolPanelProps) {
  const renderContent = () => {
    switch (activeTool) {
      case 'text':
        return (
          <div className="space-y-4">
            <TextControls
              inkColor={inkColor}
              fontFamily={fontFamily}
              fontSize={fontSize}
              onInkChange={onInkChange}
              onFontChange={onFontChange}
              onSizeChange={onSizeChange}
            />
            <button
              onClick={onAddTextBox}
              className="w-full px-4 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Add Text Box
            </button>
          </div>
        );
      case 'backgrounds':
        return (
          <BackgroundSelector
            selected={backgroundId}
            onSelect={onBackgroundChange}
          />
        );
      case 'stickers':
        return <StickerPanel onAddSticker={onAddSticker} />;
      case 'upload':
        return <ImageUploadPanel onAddImageSticker={onAddImageSticker} />;
      case 'draw':
        return (
          <DrawingCanvas
            onSave={(dataUrl) => {
              onDrawingSave(dataUrl);
              onClose();
            }}
            onClose={onClose}
          />
        );
      case 'journal':
        return (
          <JournalCanvas
            stickers={stickers}
            onStickersChange={onStickersChange}
            backgroundId={backgroundId}
            onBackgroundChange={onBackgroundChange}
            inkColor={inkColor}
            fontFamily={fontFamily}
            fontSize={fontSize}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {activeTool && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-xl z-50 max-h-[80vh] overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-heading font-semibold text-foreground capitalize">
                {activeTool}
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              {renderContent()}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}