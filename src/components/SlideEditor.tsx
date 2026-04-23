import { useState, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import NoteCanvas from './NoteCanvas';
import Toolbar from './Toolbar';
import ToolPanel from './ToolPanel';
import SlideControls from './SlideControls';
import BottomPanel from './BottomPanel';
import { backgrounds } from './BackgroundSelector';
import type { PlacedSticker } from './DraggableSticker';
import type { InkColor } from './StickerData';

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
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [inkColor, setInkColor] = useState<InkColor>('blue');
  const [fontFamily, setFontFamily] = useState('Caveat');
  const [fontSize, setFontSize] = useState(24);
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

  const handleToolSelect = (tool: string) => {
    setActiveTool(activeTool === tool ? null : tool);
  };

  const handleAddTextBox = () => {
    const randomX = 40 + Math.random() * 150;
    const randomY = 60 + Math.random() * 200;
    const id = `text-${Date.now()}`;
    updateCurrentSlide({
      stickers: [
        ...currentSlide.stickers,
        {
          instanceId: id,
          stickerId: 'text-box',
          textContent: '',
          textFont: fontFamily,
          textColor: `hsl(${inkColor === 'blue' ? '215 60% 35%' : inkColor === 'black' ? '220 20% 15%' : inkColor === 'red' ? '0 70% 50%' : '140 50% 45%'})`,
          textSize: fontSize,
          textAlign: 'center' as const,
          x: randomX,
          y: randomY,
          rotation: 0,
          scale: 1,
        },
      ],
    });
    setActiveTool(null);
  };

  const handleAddSticker = (sticker: any) => {
    const randomX = 50 + Math.random() * 200;
    const randomY = 50 + Math.random() * 250;
    const id = `sticker-${Date.now()}`;
    updateCurrentSlide({
      stickers: [
        ...currentSlide.stickers,
        {
          instanceId: id,
          stickerId: sticker.id,
          emoji: sticker.emoji,
          imageUrl: sticker.image,
          x: randomX,
          y: randomY,
          rotation: 0,
          scale: 1,
        },
      ],
    });
    setActiveTool(null);
  };

  const handleAddImageSticker = (imageUrl: string) => {
    const randomX = 50 + Math.random() * 200;
    const randomY = 50 + Math.random() * 250;
    const id = `image-${Date.now()}`;
    updateCurrentSlide({
      stickers: [
        ...currentSlide.stickers,
        {
          instanceId: id,
          stickerId: 'image',
          imageUrl,
          x: randomX,
          y: randomY,
          rotation: 0,
          scale: 1,
        },
      ],
    });
    setActiveTool(null);
  };

  const handleDrawingSave = (dataUrl: string) => {
    handleAddImageSticker(dataUrl);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Toolbar */}
      <Toolbar
        onToolSelect={handleToolSelect}
        activeTool={activeTool}
      />

      {/* Main content */}
      <div className="flex-1 px-4 py-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Canvas area */}
          <div className="flex justify-center">
            <NoteCanvas
              stickers={currentSlide.stickers}
              onStickersChange={(stickers) => updateCurrentSlide({ stickers })}
              backgroundId={currentSlide.backgroundId}
              onBackgroundChange={(backgroundId) => updateCurrentSlide({ backgroundId })}
              externalCanvasRef={canvasRef}
              inkColor={inkColor}
              fontFamily={fontFamily}
              fontSize={fontSize}
            />
          </div>

          {/* Slide controls */}
          <SlideControls
            slides={slides}
            currentIndex={currentIndex}
            onAddSlide={addSlide}
            onDuplicate={duplicateSlide}
            onDownloadHD={downloadHD}
            onExportVideo={exportVideo}
            onDeleteSlide={deleteSlide}
            onGoToSlide={goToSlide}
            isExportingVideo={isExportingVideo}
            exportProgress={exportProgress}
            exportStatus={exportStatus}
          />

          {/* Bottom panel */}
          <BottomPanel
            totalDuration={slides.length * 3}
            onAudioChange={setAudioData}
          />
        </div>
      </div>

      {/* Tool panel */}
      <ToolPanel
        activeTool={activeTool}
        onClose={() => setActiveTool(null)}
        inkColor={inkColor}
        fontFamily={fontFamily}
        fontSize={fontSize}
        onInkChange={setInkColor}
        onFontChange={setFontFamily}
        onSizeChange={setFontSize}
        onAddTextBox={handleAddTextBox}
        backgroundId={currentSlide.backgroundId}
        onBackgroundChange={(id) => updateCurrentSlide({ backgroundId: id })}
        stickers={currentSlide.stickers}
        onStickersChange={(stickers) => updateCurrentSlide({ stickers })}
        onAddSticker={handleAddSticker}
        onAddImageSticker={handleAddImageSticker}
        onDrawingSave={handleDrawingSave}
      />
    </div>
  );
};

export default SlideEditor;