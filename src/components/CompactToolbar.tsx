import { useState, useRef } from 'react';
import {
  Plus, Copy, Download, Film, Trash2,
  ChevronLeft, ChevronRight, LayoutGrid, Clock, Music, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { backgrounds } from './BackgroundSelector';
import CoffeePopup from './CoffeePopup';
import AudioTrimmer from './AudioTrimmer';

type ActivePanel = 'slides' | 'timing' | 'audio' | null;

interface SlideState {
  id: string;
  stickers: any[];
  backgroundId: string;
  durationMs: number;
}

interface CompactToolbarProps {
  slides: SlideState[];
  currentIndex: number;
  timingMode: 'equal' | 'custom';
  globalDurationMs: number;
  isExportingVideo: boolean;
  exportProgress: number;
  exportStatus: string;
  showCoffeePopup?: boolean;
  totalAudioDuration: number;
  onAddSlide: () => void;
  onDuplicate: () => void;
  onDownloadHD: () => void;
  onExportVideo: () => void;
  onDeleteSlide: (index: number) => void;
  onGoToSlide: (index: number) => void;
  onTimingModeChange: (mode: 'equal' | 'custom') => void;
  onGlobalDurationChange: (ms: number) => void;
  onCurrentSlideDurationChange: (ms: number) => void;
  onAudioChange: (data: { buffer: AudioBuffer; startTime: number; endTime: number } | null) => void;
  onCoffeePopupClose?: () => void;
}

function DurationStepper({
  durationMs,
  onChange,
}: {
  durationMs: number;
  onChange: (ms: number) => void;
}) {
  const seconds = durationMs / 1000;
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(1000, durationMs - 1000))}
        disabled={durationMs <= 1000}
        className="w-7 h-7 rounded-md border border-border bg-accent flex items-center justify-center text-base font-bold text-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent/80 transition-colors"
      >
        −
      </button>
      <span className="min-w-[36px] text-center text-[13px] font-bold bg-primary/10 text-primary rounded-md px-2 py-1">
        {seconds}s
      </span>
      <button
        onClick={() => onChange(Math.min(5000, durationMs + 1000))}
        disabled={durationMs >= 5000}
        className="w-7 h-7 rounded-md border border-border bg-accent flex items-center justify-center text-base font-bold text-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent/80 transition-colors"
      >
        +
      </button>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onClick={() => onChange(s * 1000)}
            title={`${s}s`}
            className="w-2 h-2 rounded-full border-none p-0 cursor-pointer transition-colors"
            style={{
              background: seconds >= s ? 'hsl(var(--primary))' : 'hsl(var(--border))',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function CompactToolbar({
  slides,
  currentIndex,
  timingMode,
  globalDurationMs,
  isExportingVideo,
  exportProgress,
  exportStatus,
  showCoffeePopup = false,
  totalAudioDuration,
  onAddSlide,
  onDuplicate,
  onDownloadHD,
  onExportVideo,
  onDeleteSlide,
  onGoToSlide,
  onTimingModeChange,
  onGlobalDurationChange,
  onCurrentSlideDurationChange,
  onAudioChange,
  onCoffeePopupClose,
}: CompactToolbarProps) {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const currentSlide = slides[currentIndex];

  const togglePanel = (panel: ActivePanel) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  const panelBtnClass = (panel: ActivePanel) =>
    `flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors border ${
      activePanel === panel
        ? 'bg-primary/10 text-primary border-primary/30'
        : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
    }`;

  return (
    <>
      <CoffeePopup isOpen={showCoffeePopup} onClose={onCoffeePopupClose || (() => {})} />

      {/* ── Compact toolbar bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-center gap-1 bg-card border border-border rounded-lg px-2.5 py-1.5 mb-2"
      >
        {/* Slide navigation */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onGoToSlide(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted disabled:opacity-30 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[13px] font-medium min-w-[72px] text-center whitespace-nowrap">
            {currentIndex + 1} / {slides.length}
          </span>
          <button
            onClick={() => onGoToSlide(currentIndex + 1)}
            disabled={currentIndex === slides.length - 1}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted disabled:opacity-30 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-1 shrink-0" />

        {/* Panel toggles */}
        <div className="flex items-center gap-1">
          <button className={panelBtnClass('slides')} onClick={() => togglePanel('slides')}>
            <LayoutGrid className="w-3.5 h-3.5" />
            Slides
          </button>
          <button className={panelBtnClass('timing')} onClick={() => togglePanel('timing')}>
            <Clock className="w-3.5 h-3.5" />
            Timing
          </button>
          <button className={panelBtnClass('audio')} onClick={() => togglePanel('audio')}>
            <Music className="w-3.5 h-3.5" />
            Audio
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-1 shrink-0" />

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={onDownloadHD}
            disabled={isExportingVideo}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border bg-transparent text-[13px] font-medium text-foreground hover:bg-muted disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Image
          </button>
          <button
            onClick={onExportVideo}
            disabled={slides.length < 2 || isExportingVideo}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            <Film className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </motion.div>

      {/* Export progress bar */}
      <AnimatePresence>
        {isExportingVideo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 px-3 py-2 bg-card border border-border rounded-lg"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">{exportStatus}</span>
              <span className="text-xs text-muted-foreground">{exportProgress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Slides panel ── */}
      <AnimatePresence>
        {activePanel === 'slides' && (
          <motion.div
            key="panel-slides"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="bg-card border border-border rounded-lg p-3 mb-2"
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[13px] font-semibold text-foreground">Pages</span>
              <button
                onClick={() => setActivePanel(null)}
                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors"
                aria-label="Close panel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Thumbnails */}
            <div ref={stripRef} className="flex gap-2 overflow-x-auto pb-2 mb-3">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  onClick={() => onGoToSlide(i)}
                  className={`relative flex-shrink-0 w-11 h-[60px] rounded-lg overflow-hidden border-2 transition-all ${
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
                  <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] text-center leading-3 py-px">
                    {i + 1}
                  </span>
                  {slide.stickers.length > 0 && (
                    <span className="absolute top-0.5 right-0.5 bg-primary text-primary-foreground text-[7px] rounded-full w-3 h-3 flex items-center justify-center">
                      {slide.stickers.length}
                    </span>
                  )}
                  {slides.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteSlide(i); }}
                      className="absolute top-0 left-0 w-4 h-4 bg-destructive rounded-br flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                      aria-label={`Delete slide ${i + 1}`}
                    >
                      <Trash2 className="w-2.5 h-2.5 text-destructive-foreground" />
                    </button>
                  )}
                </button>
              ))}
            </div>

            {/* Add / Duplicate */}
            <div className="flex gap-2">
              <button
                onClick={onAddSlide}
                disabled={slides.length >= 30}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-[13px] font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add page
              </button>
              <button
                onClick={onDuplicate}
                disabled={slides.length >= 30}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-[13px] font-medium hover:bg-secondary/80 disabled:opacity-50 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                Duplicate
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Timing panel ── */}
      <AnimatePresence>
        {activePanel === 'timing' && (
          <motion.div
            key="panel-timing"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="bg-card border border-border rounded-lg p-3 mb-2"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-semibold text-foreground">Slide timing</span>
              <div className="flex items-center gap-2">
                {/* Mode toggle */}
                <div className="flex bg-muted rounded-md p-0.5 gap-0.5">
                  {(['equal', 'custom'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => onTimingModeChange(mode)}
                      className={`px-3 py-1 rounded text-[12px] font-semibold transition-all ${
                        timingMode === mode
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-transparent text-muted-foreground'
                      }`}
                    >
                      {mode === 'equal' ? '⏱ Equal' : '✦ Custom'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setActivePanel(null)}
                  className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors"
                  aria-label="Close panel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {timingMode === 'equal' ? (
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-muted-foreground">All slides</span>
                <DurationStepper durationMs={globalDurationMs} onChange={onGlobalDurationChange} />
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  <span className="text-[12px] text-muted-foreground min-w-[72px]">
                    Slide {currentIndex + 1} / {slides.length}
                  </span>
                  <DurationStepper
                    durationMs={currentSlide?.durationMs ?? 3000}
                    onChange={onCurrentSlideDurationChange}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground/60">
                  Navigate to each slide to set its duration individually.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Audio panel ── */}
      <AnimatePresence>
        {activePanel === 'audio' && (
          <motion.div
            key="panel-audio"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="bg-card border border-border rounded-lg p-3 mb-2"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-semibold text-foreground">Audio</span>
              <button
                onClick={() => setActivePanel(null)}
                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors"
                aria-label="Close panel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <AudioTrimmer
              totalDuration={totalAudioDuration}
              onAudioChange={onAudioChange}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}