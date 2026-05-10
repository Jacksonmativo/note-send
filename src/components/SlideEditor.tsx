import { useState, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import NoteCanvas from './NoteCanvas';
import Toolbar from './Toolbar';
import ToolPanel from './ToolPanel';
import CompactToolbar from './CompactToolbar';
import { backgrounds } from './BackgroundSelector';
import type { PlacedSticker } from './DraggableSticker';
import type { InkColor } from './StickerData';

interface SlideState {
  id: string;
  stickers: PlacedSticker[];
  backgroundId: string;
  durationMs: number;
}

const MAX_SLIDES = 30;
const DEFAULT_DURATION_MS = 3000;
const TRANSITION_MS = 500;
const FPS = 30;

const drawContain = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasW: number,
  canvasH: number
) => {
  const scale = Math.min(canvasW / img.naturalWidth, canvasH / img.naturalHeight);
  const drawW = img.naturalWidth * scale;
  const drawH = img.naturalHeight * scale;
  const offsetX = (canvasW - drawW) / 2;
  const offsetY = (canvasH - drawH) / 2;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvasW, canvasH);
  ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
};

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

const SlideEditor = () => {
  const [slides, setSlides] = useState<SlideState[]>([
    { id: `slide-${Date.now()}`, stickers: [], backgroundId: 'notebook', durationMs: DEFAULT_DURATION_MS },
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
  const [showCoffeePopup, setShowCoffeePopup] = useState(false);
  const [timingMode, setTimingMode] = useState<'equal' | 'custom'>('equal');
  const [globalDurationMs, setGlobalDurationMs] = useState(DEFAULT_DURATION_MS);

  const canvasRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
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
      durationMs: currentSlide?.durationMs ?? DEFAULT_DURATION_MS,
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
      durationMs: currentSlide.durationMs,
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
      setShowCoffeePopup(true);
    } catch (err) {
      console.error('HD download failed:', err);
    }
  };

  const loadImg = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const exportVideo = async () => {
    if (!canvasRef.current || slides.length < 2) return;

    setIsExportingVideo(true);
    setExportProgress(0);
    setExportStatus('Capturing slides...');
    exportCancelledRef.current = false;

    const images: string[] = [];
    const originalIndex = currentIndex;

    try {
      for (let i = 0; i < slides.length; i++) {
        if (exportCancelledRef.current) throw new Error('cancelled');
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
      setExportProgress(42);
      setExportStatus('Loading images...');

      const loadedImages = await Promise.all(images.map(loadImg));
      if (exportCancelledRef.current) throw new Error('cancelled');

      setExportProgress(45);
      setExportStatus('Encoding video...');

      const offscreen = document.createElement('canvas');
      offscreen.width = 1080;
      offscreen.height = 1920;
      const ctx = offscreen.getContext('2d')!;

      const stream = offscreen.captureStream(FPS);

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
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      const videoPromise = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
      });

      recorder.start();

      const totalSlides = loadedImages.length;

      for (let i = 0; i < totalSlides; i++) {
        if (exportCancelledRef.current) throw new Error('cancelled');

        const curImg = loadedImages[i];
        const nextImg = i < totalSlides - 1 ? loadedImages[i + 1] : null;
        const holdMs = Math.max(200, (slides[i]?.durationMs ?? DEFAULT_DURATION_MS) - TRANSITION_MS);

        const holdStart = performance.now();
        while (performance.now() - holdStart < holdMs) {
          if (exportCancelledRef.current) throw new Error('cancelled');
          ctx.globalAlpha = 1;
          drawContain(ctx, curImg, offscreen.width, offscreen.height);
          await nextFrame();
        }

        if (nextImg) {
          const transStart = performance.now();
          while (true) {
            const elapsed = performance.now() - transStart;
            const rawT = Math.min(elapsed / TRANSITION_MS, 1);
            const alpha = easeInOut(rawT);
            ctx.globalAlpha = 1;
            drawContain(ctx, curImg, offscreen.width, offscreen.height);
            ctx.globalAlpha = alpha;
            drawContain(ctx, nextImg, offscreen.width, offscreen.height);
            ctx.globalAlpha = 1;
            await nextFrame();
            if (rawT >= 1) break;
            if (exportCancelledRef.current) throw new Error('cancelled');
          }
        }

        setExportProgress(45 + Math.round(((i + 1) / totalSlides) * 50));
      }

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

  const handleTimingModeChange = (mode: 'equal' | 'custom') => {
    setTimingMode(mode);
    if (mode === 'equal') {
      setSlides((prev) => prev.map((s) => ({ ...s, durationMs: globalDurationMs })));
    }
  };

  const handleGlobalDurationChange = (ms: number) => {
    setGlobalDurationMs(ms);
    setSlides((prev) => prev.map((s) => ({ ...s, durationMs: ms })));
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

  const totalAudioDuration = slides.reduce(
    (sum, s) => sum + (s.durationMs ?? DEFAULT_DURATION_MS) / 1000,
    0
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Toolbar
        onToolSelect={handleToolSelect}
        activeTool={activeTool}
      />

      <div className="flex-1 px-4 py-6">
        <div className="max-w-5xl mx-auto space-y-4">
          {/* Canvas */}
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

          {/* Compact toolbar — replaces SlideControls + SlideDurationPicker + AudioTrimmer */}
          <CompactToolbar
            slides={slides}
            currentIndex={currentIndex}
            timingMode={timingMode}
            globalDurationMs={globalDurationMs}
            isExportingVideo={isExportingVideo}
            exportProgress={exportProgress}
            exportStatus={exportStatus}
            showCoffeePopup={showCoffeePopup}
            totalAudioDuration={totalAudioDuration}
            onAddSlide={addSlide}
            onDuplicate={duplicateSlide}
            onDownloadHD={downloadHD}
            onExportVideo={exportVideo}
            onDeleteSlide={deleteSlide}
            onGoToSlide={goToSlide}
            onTimingModeChange={handleTimingModeChange}
            onGlobalDurationChange={handleGlobalDurationChange}
            onCurrentSlideDurationChange={(ms) => updateCurrentSlide({ durationMs: ms })}
            onAudioChange={setAudioData}
            onCoffeePopupClose={() => setShowCoffeePopup(false)}
          />
        </div>
      </div>

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