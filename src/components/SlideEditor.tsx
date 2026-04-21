import { useState, useRef, useCallback } from 'react';
import { Plus, Trash2, Film, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import { motion } from 'framer-motion';
import NoteCanvas from './NoteCanvas';
import { backgrounds } from './BackgroundSelector';
import { Progress } from './ui/progress';
import AudioTrimmer from './AudioTrimmer';
import type { PlacedSticker } from './DraggableSticker';

interface SlideState {
  id: string;
  stickers: PlacedSticker[];
  backgroundId: string;
}

const MAX_SLIDES = 30;
const SLIDE_DURATION_MS = 3000;
const TRANSITION_MS = 500;
const FPS = 60;
const FRAME_MS = 1000 / FPS;

const SlideEditor = () => {
  const [slides, setSlides] = useState<SlideState[]>([
    { id: `slide-${Date.now()}`, stickers: [], backgroundId: 'notebook' },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  const [audioData, setAudioData] = useState<{
    buffer: AudioBuffer;
    startTime: number;
    endTime: number;
  } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  // Ref to allow cancelling an in-progress export
  const exportCancelledRef = useRef(false);

  const currentSlide = slides[currentIndex];

  const updateCurrentSlide = useCallback(
    (updates: Partial<SlideState>) => {
      setSlides((prev) =>
        prev.map((s, i) => (i === currentIndex ? { ...s, ...updates } : s))
      );
    },
    [currentIndex]
  );

  const addSlide = () => {
    if (slides.length >= MAX_SLIDES) return;
    const newSlide: SlideState = {
      id: `slide-${Date.now()}`,
      stickers: [],
      backgroundId: currentSlide?.backgroundId || 'notebook',
    };
    setSlides((prev) => [...prev, newSlide]);
    setCurrentIndex(slides.length);
    setTimeout(() => {
      stripRef.current?.scrollTo({ left: stripRef.current.scrollWidth, behavior: 'smooth' });
    }, 50);
  };

  const duplicateSlide = () => {
    if (slides.length >= MAX_SLIDES || !currentSlide) return;
    const dup: SlideState = {
      id: `slide-${Date.now()}`,
      stickers: currentSlide.stickers.map((s) => ({
        ...s,
        instanceId: `${s.instanceId}-dup-${Date.now()}`,
      })),
      backgroundId: currentSlide.backgroundId,
    };
    const newSlides = [...slides];
    newSlides.splice(currentIndex + 1, 0, dup);
    setSlides(newSlides);
    setCurrentIndex(currentIndex + 1);
  };

  const deleteSlide = (index: number) => {
    if (slides.length <= 1) return;
    setSlides((prev) => prev.filter((_, i) => i !== index));
    if (currentIndex >= slides.length - 1) {
      setCurrentIndex(Math.max(0, slides.length - 2));
    } else if (index < currentIndex) {
      setCurrentIndex((prev) => prev - 1);
    } else if (index === currentIndex) {
      setCurrentIndex(Math.min(index, slides.length - 2));
    }
  };

  const goToSlide = (index: number) => {
    if (index >= 0 && index < slides.length) setCurrentIndex(index);
  };

  // HD PNG download of current slide
  const downloadHD = async () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = await toPng(canvasRef.current, {
        quality: 1,
        pixelRatio: 4,
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `slide-${currentIndex + 1}-HD-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('HD download failed:', err);
    }
  };

  // Load an HTMLImageElement from a data URL
  const loadImg = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  // Ease-in-out curve for smooth crossfades
  const easeInOut = (t: number) =>
    t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

  // Video export: frame-by-frame deterministic loop so MediaRecorder
  // captures every frame at the correct time.
  const exportVideo = async () => {
    if (!canvasRef.current || slides.length < 2) return;

    setIsExportingVideo(true);
    setExportProgress(0);
    setExportStatus('Capturing slides...');
    exportCancelledRef.current = false;

    const images: string[] = [];
    const originalIndex = currentIndex;

    try {
      // ── Phase 1: render each slide to PNG ──────────────────────────────
      for (let i = 0; i < slides.length; i++) {
        if (exportCancelledRef.current) throw new Error('cancelled');

        setCurrentIndex(i);
        setExportProgress(Math.round((i / slides.length) * 40));

        // Wait for React to re-render the canvas with the new slide
        await new Promise((r) => setTimeout(r, 400));

        const dataUrl = await toPng(canvasRef.current!, {
          quality: 1,
          pixelRatio: 2,
          cacheBust: true,
        });
        images.push(dataUrl);
      }

      setCurrentIndex(originalIndex);
      setExportProgress(42);
      setExportStatus('Loading images...');

      // ── Phase 2: pre-load all captured PNGs into Image elements ────────
      const loadedImages = await Promise.all(images.map(loadImg));

      if (exportCancelledRef.current) throw new Error('cancelled');

      setExportProgress(45);
      setExportStatus('Encoding video...');

      // ── Phase 3: set up off-screen canvas + MediaRecorder ──────────────
      const offscreen = document.createElement('canvas');
      offscreen.width = 1080;
      offscreen.height = 1920;
      const ctx = offscreen.getContext('2d')!;

      const stream = offscreen.captureStream(FPS);

      // Attach audio track if provided
      let audioCtx: AudioContext | null = null;
      if (audioData) {
        audioCtx = new AudioContext();
        const source = audioCtx.createBufferSource();
        source.buffer = audioData.buffer;
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
        const duration = audioData.endTime - audioData.startTime;
        source.start(0, audioData.startTime, duration);
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 10_000_000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const videoPromise = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
      });

      recorder.start();

      // ── Phase 4: frame-by-frame draw loop ──────────────────────────────
      //
      // Strategy: for each slide we draw `holdFrames` frames showing only
      // that slide, then `transFrames` frames crossfading into the next.
      // The last slide only holds — no trailing transition.
      //
      // We pace each frame with setTimeout(fn, FRAME_MS) which gives the
      // canvas.captureStream() enough time to pull each drawn frame before
      // we overwrite it, producing a smooth, gap-free video track.

      const holdFrames = Math.round((SLIDE_DURATION_MS - TRANSITION_MS) / FRAME_MS);
      const transFrames = Math.round(TRANSITION_MS / FRAME_MS);
      const totalSlides = loadedImages.length;
      // Total frame count
      const totalFrames =
        totalSlides * holdFrames + (totalSlides - 1) * transFrames;

      await new Promise<void>((resolve, reject) => {
        let frame = 0;

        const drawFrame = () => {
          if (exportCancelledRef.current) {
            reject(new Error('cancelled'));
            return;
          }

          if (frame >= totalFrames) {
            resolve();
            return;
          }

          // Determine which slide and phase we're in.
          // Each "slot" is holdFrames + transFrames wide, except the last
          // slide which is only holdFrames wide.
          const slotWidth = holdFrames + transFrames;
          const slideIndex = Math.min(
            Math.floor(frame / slotWidth),
            totalSlides - 1
          );
          const frameInSlot = frame - slideIndex * slotWidth;
          const isLastSlide = slideIndex === totalSlides - 1;

          const curImg = loadedImages[slideIndex];
          const nextImg = !isLastSlide ? loadedImages[slideIndex + 1] : null;

          ctx.globalAlpha = 1;
          ctx.clearRect(0, 0, offscreen.width, offscreen.height);

          if (frameInSlot < holdFrames || !nextImg) {
            // ── Hold phase: show current slide only ──
            ctx.drawImage(curImg, 0, 0, offscreen.width, offscreen.height);
          } else {
            // ── Transition phase: crossfade current → next ──
            const rawT = (frameInSlot - holdFrames) / transFrames;
            const alpha = easeInOut(Math.min(rawT, 1));

            // Draw current slide at full opacity
            ctx.globalAlpha = 1;
            ctx.drawImage(curImg, 0, 0, offscreen.width, offscreen.height);

            // Draw next slide on top with increasing opacity
            ctx.globalAlpha = alpha;
            ctx.drawImage(nextImg, 0, 0, offscreen.width, offscreen.height);

            // Reset alpha
            ctx.globalAlpha = 1;
          }

          // Update progress bar (45 → 95%)
          setExportProgress(45 + Math.round((frame / totalFrames) * 50));

          frame++;
          setTimeout(drawFrame, FRAME_MS);
        };

        // Kick off with a small initial delay so the recorder is fully ready
        setTimeout(drawFrame, 100);
      });

      // ── Phase 5: stop recording + download ─────────────────────────────
      recorder.stop();
      if (audioCtx) audioCtx.close();
      setExportProgress(95);
      setExportStatus('Finishing up...');

      const blob = await videoPromise;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `slideshow-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportProgress(100);
      setExportStatus('Done!');
      await new Promise((r) => setTimeout(r, 800));
    } catch (err: unknown) {
      if (err instanceof Error && err.message !== 'cancelled') {
        console.error('Video export failed:', err);
      }
      setCurrentIndex(originalIndex);
    }

    setIsExportingVideo(false);
    setExportProgress(0);
    setExportStatus('');
  };

  const cancelExport = () => {
    exportCancelledRef.current = true;
  };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto gap-4 p-4">
      {/* Canvas area */}
      <NoteCanvas
        stickers={currentSlide.stickers}
        onStickersChange={(stickers) => updateCurrentSlide({ stickers })}
        backgroundId={currentSlide.backgroundId}
        onBackgroundChange={(backgroundId) => updateCurrentSlide({ backgroundId })}
        externalCanvasRef={canvasRef}
      />

      {/* Slide strip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-card rounded-xl p-3 paper-shadow"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToSlide(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="p-1 rounded-md hover:bg-accent disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>

          <div
            ref={stripRef}
            className="flex-1 flex gap-2 overflow-x-auto py-1 px-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                onClick={() => goToSlide(i)}
                className={`relative flex-shrink-0 w-16 h-20 rounded-md overflow-hidden border-2 transition-all hover:scale-105 group ${
                  i === currentIndex
                    ? 'border-primary ring-1 ring-primary shadow-md'
                    : 'border-border hover:border-muted-foreground/50'
                }`}
              >
                <img
                  src={
                    backgrounds.find((b) => b.id === slide.backgroundId)?.src ||
                    backgrounds[0].src
                  }
                  className="w-full h-full object-cover"
                  alt={`Slide ${i + 1}`}
                  draggable={false}
                />
                <span className="absolute bottom-0 left-0 right-0 bg-foreground/70 text-background text-[10px] text-center font-handwriting-patrick">
                  {i + 1}
                </span>
                {slide.stickers.length > 0 && (
                  <span className="absolute top-0.5 left-0.5 bg-primary/80 text-primary-foreground text-[8px] rounded-full w-3.5 h-3.5 flex items-center justify-center">
                    {slide.stickers.length}
                  </span>
                )}
                {slides.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSlide(i);
                    }}
                    className="absolute top-0 right-0 w-4 h-4 bg-destructive rounded-bl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-2.5 h-2.5 text-destructive-foreground" />
                  </button>
                )}
              </button>
            ))}

            {slides.length < MAX_SLIDES && (
              <button
                onClick={addSlide}
                className="flex-shrink-0 w-16 h-20 rounded-md border-2 border-dashed border-border flex items-center justify-center hover:border-primary hover:bg-accent/30 transition-all"
                title="Add slide"
              >
                <Plus className="w-5 h-5 text-muted-foreground" />
              </button>
            )}
          </div>

          <button
            onClick={() => goToSlide(currentIndex + 1)}
            disabled={currentIndex === slides.length - 1}
            className="p-1 rounded-md hover:bg-accent disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground font-handwriting-patrick">
            Slide {currentIndex + 1}/{slides.length} · {slides.length * 3}s / 90s max
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={duplicateSlide}
              disabled={slides.length >= MAX_SLIDES}
              className="px-2 py-1 text-xs rounded-md bg-secondary text-secondary-foreground font-handwriting-patrick hover:bg-secondary/80 disabled:opacity-50 transition-colors"
            >
              Duplicate
            </button>
            <button
              onClick={downloadHD}
              disabled={isExportingVideo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[hsl(340,65%,65%)] text-white font-handwriting-patrick text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
              title="Download current slide as HD PNG (1080×1920)"
            >
              <Download className="w-4 h-4" />
              HD
            </button>
            {isExportingVideo ? (
              <button
                onClick={cancelExport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground font-handwriting-patrick text-sm hover:opacity-90 transition-opacity"
              >
                Cancel
              </button>
            ) : (
              <button
                onClick={exportVideo}
                disabled={slides.length < 2}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-handwriting-patrick text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
                title={slides.length < 2 ? 'Add at least 2 slides to export' : 'Export as .webm video'}
              >
                <Film className="w-4 h-4" />
                Export Video
              </button>
            )}
          </div>
        </div>

        {/* Export progress */}
        {isExportingVideo && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-muted-foreground font-handwriting-patrick">
                {exportStatus}
              </p>
              <p className="text-[10px] text-muted-foreground font-handwriting-patrick">
                {exportProgress}%
              </p>
            </div>
            <Progress value={exportProgress} className="h-2" />
          </div>
        )}
      </motion.div>

      {/* Audio Trimmer */}
      <AudioTrimmer
        totalDuration={slides.length * 3}
        onAudioChange={setAudioData}
      />
    </div>
  );
};

export default SlideEditor;