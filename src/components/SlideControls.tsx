import { Plus, Copy, Download, Film, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { backgrounds } from './BackgroundSelector';

interface SlideControlsProps {
  slides: any[];
  currentIndex: number;
  onAddSlide: () => void;
  onDuplicate: () => void;
  onDownloadHD: () => void;
  onExportVideo: () => void;
  onDeleteSlide: (index: number) => void;
  onGoToSlide: (index: number) => void;
  isExportingVideo: boolean;
  exportProgress: number;
  exportStatus: string;
}

export default function SlideControls({
  slides,
  currentIndex,
  onAddSlide,
  onDuplicate,
  onDownloadHD,
  onExportVideo,
  onDeleteSlide,
  onGoToSlide,
  isExportingVideo,
  exportProgress,
  exportStatus,
}: SlideControlsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="bg-card rounded-lg border border-border p-4 mb-4"
    >
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onGoToSlide(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium">
            Slide {currentIndex + 1} of {slides.length}
          </span>
          <button
            onClick={() => onGoToSlide(currentIndex + 1)}
            disabled={currentIndex === slides.length - 1}
            className="p-2 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={onAddSlide}
          disabled={slides.length >= 30}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Page
        </button>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            onClick={() => onGoToSlide(i)}
            className={`relative flex-shrink-0 w-12 h-16 rounded-lg overflow-hidden border-2 transition-all ${
              i === currentIndex
                ? 'border-primary ring-1 ring-primary/20'
                : 'border-border hover:border-muted-foreground/50'
            }`}
          >
            <img
              src={backgrounds.find((b) => b.id === slide.backgroundId)?.src || backgrounds[0].src}
              className="w-full h-full object-cover"
              alt={`Slide ${i + 1}`}
            />
            <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] text-center">
              {i + 1}
            </span>
            {slide.stickers.length > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-primary text-primary-foreground text-[8px] rounded-full w-3 h-3 flex items-center justify-center">
                {slide.stickers.length}
              </span>
            )}
            {slides.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSlide(i);
                }}
                className="absolute top-0 left-0 w-4 h-4 bg-destructive rounded-bl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-2.5 h-2.5 text-destructive-foreground" />
              </button>
            )}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onDuplicate}
          disabled={slides.length >= 30}
          className="flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 disabled:opacity-50 transition-colors text-sm"
        >
          <Copy className="w-4 h-4" />
          Duplicate
        </button>
        <button
          onClick={onDownloadHD}
          disabled={isExportingVideo}
          className="flex items-center gap-2 px-3 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors text-sm"
        >
          <Download className="w-4 h-4" />
          HD
        </button>
        <button
          onClick={onExportVideo}
          disabled={slides.length < 2 || isExportingVideo}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm"
        >
          <Film className="w-4 h-4" />
          Export Video
        </button>
      </div>

      {/* Export progress */}
      {isExportingVideo && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">{exportStatus}</span>
            <span className="text-xs text-muted-foreground">{exportProgress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}