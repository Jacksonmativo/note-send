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

const MAX_SLIDES = 30; // 90s max / 3s per slide
const SLIDE_DURATION_MS = 3000;
const TRANSITION_MS = 500; // crossfade duration
const TRANSITION_FRAMES = 30; // frames during transition at 60fps

const SlideEditor = () => {
  const [slides, setSlides] = useState<SlideState[]>([
    { id: `slide-${Date.now()}`, stickers: [], backgroundId: 'notebook' },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [audioData, setAudioData] = useState<{ buffer: AudioBuffer; startTime: number; endTime: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

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
    // Scroll strip to end
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
        pixelRatio: 4, // Higher pixel ratio for HD 1080x1920
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

  // Video export using Canvas + MediaRecorder
  const exportVideo = async () => {
    if (!canvasRef.current || slides.length < 2) return;
    setIsExportingVideo(true);
    setExportProgress(0);

    try {
      const images: string[] = [];
      const originalIndex = currentIndex;

      // Phase 1: Capture each slide as PNG
      for (let i = 0; i < slides.length; i++) {
        setCurrentIndex(i);
        setExportProgress(Math.round((i / slides.length) * 40));
        await new Promise((r) => setTimeout(r, 400));

        const dataUrl = await toPng(canvasRef.current!, {
          quality: 1,
          pixelRatio: 2,
          cacheBust: true,
        });
        images.push(dataUrl);
      }

      setCurrentIndex(originalIndex);
      setExportProgress(45);

      // Phase 2: Create video
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d')!;

      const stream = canvas.captureStream(60);

      // Mix audio into stream if available
      if (audioData) {
        const audioCtx = new AudioContext();
        const source = audioCtx.createBufferSource();
        source.buffer = audioData.buffer;
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        dest.stream.getAudioTracks().forEach(track => stream.addTrack(track));
        const audioDuration = audioData.endTime - audioData.startTime;
        source.start(0, audioData.startTime, audioDuration);
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

      // Helper to load an image
      const loadImg = (src: string) =>
        new Promise<HTMLImageElement>((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.src = src;
        });

      // Helper: wait using requestAnimationFrame for proper stream sync
      const waitFrames = (ms: number) =>
        new Promise<void>((resolve) => {
          const start = performance.now();
          const tick = () => {
            ctx.getImageData(0, 0, 1, 1); // force flush
            if (performance.now() - start >= ms) {
              resolve();
            } else {
              requestAnimationFrame(tick);
            }
          };
          requestAnimationFrame(tick);
        });

      // Pre-load all images
      const loadedImages = await Promise.all(images.map(loadImg));

      // Prime the recorder with first frame to avoid initial delay
      ctx.globalAlpha = 1;
      ctx.drawImage(loadedImages[0], 0, 0, canvas.width, canvas.height);
      await waitFrames(50);

      // Draw each slide with crossfade transitions
      for (let i = 0; i < loadedImages.length; i++) {
        setExportProgress(45 + Math.round((i / loadedImages.length) * 50));

        const currentImg = loadedImages[i];

        // Draw the current slide fully
        ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(currentImg, 0, 0, canvas.width, canvas.height);

        // Hold the slide (minus transition time if there's a next slide)
        const holdTime = i < loadedImages.length - 1 ? SLIDE_DURATION_MS - TRANSITION_MS : SLIDE_DURATION_MS;
        await waitFrames(holdTime);

        // Crossfade to next slide
        if (i < loadedImages.length - 1) {
          const nextImg = loadedImages[i + 1];
          const transitionStart = performance.now();

          await new Promise<void>((resolve) => {
            const animateTransition = () => {
              const elapsed = performance.now() - transitionStart;
              const progress = Math.min(elapsed / TRANSITION_MS, 1);

              ctx.globalAlpha = 1;
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(currentImg, 0, 0, canvas.width, canvas.height);
              ctx.globalAlpha = progress;
              ctx.drawImage(nextImg, 0, 0, canvas.width, canvas.height);

              if (progress < 1) {
                requestAnimationFrame(animateTransition);
              } else {
                ctx.globalAlpha = 1;
                resolve();
              }
            };
            requestAnimationFrame(animateTransition);
          });
        }
      }

      recorder.stop();
      setExportProgress(95);
      const blob = await videoPromise;

      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `slideshow-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportProgress(100);
    } catch (err) {
      console.error('Video export failed:', err);
    }

    setIsExportingVideo(false);
    setExportProgress(0);
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
                className={`relative flex-shrink-0 w-16 h-20 rounded-md overflow-hidden border-2 transition-all hover:scale-105 ${
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
                    className="absolute top-0 right-0 w-4 h-4 bg-destructive rounded-bl flex items-center justify-center opacity-0 group-hover:opacity-100 hover:!opacity-100 transition-opacity"
                    style={{ opacity: i === currentIndex ? 0.8 : 0 }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.opacity = '1')}
                    onMouseLeave={(e) =>
                      ((e.target as HTMLElement).style.opacity = i === currentIndex ? '0.8' : '0')
                    }
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
              className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary text-secondary-foreground font-handwriting-patrick text-xs hover:bg-secondary/80 transition-colors"
              title="Download current slide as HD PNG (1080×1920)"
            >
              <Download className="w-3.5 h-3.5" />
              HD
            </button>
            <button
              onClick={exportVideo}
              disabled={isExportingVideo || slides.length < 2}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-handwriting-patrick text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Film className="w-4 h-4" />
              {isExportingVideo ? `Exporting ${exportProgress}%` : 'Export Video'}
            </button>
          </div>
        </div>

        {/* Export progress bar */}
        {isExportingVideo && (
          <div className="mt-2">
            <Progress value={exportProgress} className="h-2" />
            <p className="text-[10px] text-muted-foreground font-handwriting-patrick mt-1 text-center">
              {exportProgress < 45
                ? 'Capturing slides...'
                : exportProgress < 95
                ? 'Encoding video...'
                : 'Finishing up...'}
            </p>
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
