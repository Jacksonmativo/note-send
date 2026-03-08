import { useState, useRef, useCallback } from 'react';
import { Upload, ChevronLeft, ChevronRight, Download, Pencil, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { PDFDocument } from 'pdf-lib';
import DraggableSticker, { type PlacedSticker } from './DraggableSticker';
import DrawingCanvas from './DrawingCanvas';

interface PageStickers {
  [pageIndex: number]: PlacedSticker[];
}

const PdfSigner = () => {
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState('');
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number }[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageStickers, setPageStickers] = useState<PageStickers>({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const currentStickers = pageStickers[currentPage] || [];

  const setCurrentStickers = useCallback(
    (updater: PlacedSticker[] | ((prev: PlacedSticker[]) => PlacedSticker[])) => {
      setPageStickers(prev => {
        const current = prev[currentPage] || [];
        const newVal = typeof updater === 'function' ? updater(current) : updater;
        return { ...prev, [currentPage]: newVal };
      });
    },
    [currentPage]
  );

  const renderPdfPages = useCallback(async (buffer: ArrayBuffer) => {
    setIsLoading(true);
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
      const images: string[] = [];
      const dimensions: { width: number; height: number }[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });

        // Store the actual PDF dimensions (at scale 1)
        const originalViewport = page.getViewport({ scale: 1 });
        dimensions.push({
          width: originalViewport.width,
          height: originalViewport.height
        });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport }).promise;
        images.push(canvas.toDataURL('image/png'));
      }

      setPageImages(images);
      setPageDimensions(dimensions);
    } catch (err) {
      console.error('Failed to render PDF:', err);
    }
    setIsLoading(false);
  }, []);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setFileName(file.name);
      const buffer = await file.arrayBuffer();
      setPdfBytes(buffer.slice(0)); // Store a copy to prevent detachment
      setPageStickers({});
      setCurrentPage(0);
      await renderPdfPages(buffer);
    },
    [renderPdfPages]
  );

  const addDrawnSticker = useCallback(
    (dataUrl: string) => {
      const randomX = 80 + Math.random() * 100;
      const randomY = 80 + Math.random() * 100;
      setCurrentStickers(prev => [
        ...prev,
        {
          instanceId: `sig-${Date.now()}`,
          stickerId: 'signature',
          imageUrl: dataUrl,
          x: randomX,
          y: randomY,
          rotation: 0,
          scale: 1,
          layer: 'image' as const,
        },
      ]);
    },
    [setCurrentStickers]
  );

  const updateSticker = useCallback(
    (updated: PlacedSticker) => {
      setCurrentStickers(prev =>
        prev.map(s => (s.instanceId === updated.instanceId ? updated : s))
      );
    },
    [setCurrentStickers]
  );

  const deleteSticker = useCallback(
    (instanceId: string) => {
      setCurrentStickers(prev => prev.filter(s => s.instanceId !== instanceId));
    },
    [setCurrentStickers]
  );

  const resetDocument = useCallback(() => {
    setPdfBytes(null);
    setPageImages([]);
    setPageDimensions([]);
    setPageStickers({});
    setCurrentPage(0);
    setFileName('');
  }, []);

  const exportPdf = useCallback(async () => {
    if (!pdfBytes) return;
    setIsExporting(true);

    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = pdfDoc.getPages();

      // Read container dimensions once, reliably, before the loop
      const containerEl = canvasRef.current;
      if (!containerEl) throw new Error('Canvas container not found');
      const rect = containerEl.getBoundingClientRect();
      const containerW = rect.width || containerEl.offsetWidth;
      const containerH = rect.height || containerEl.offsetHeight;
      if (!containerW || !containerH) throw new Error('Container has no dimensions');

      for (const [pageIndexStr, stickers] of Object.entries(pageStickers)) {
        const pageIndex = parseInt(pageIndexStr);
        const page = pages[pageIndex];
        if (!page || stickers.length === 0) continue;

        const { width: pdfW, height: pdfH } = page.getSize();

        // The PNG image is rendered at 2x scale
        const pngW = pdfW * 2;
        const pngH = pdfH * 2;

        // Calculate how the PNG image (at 2x scale) is scaled within the container (object-contain)
        const imgScale = Math.min(containerW / pngW, containerH / pngH);
        const displayedWidth = pngW * imgScale;
        const displayedHeight = pngH * imgScale;
        const offsetX = (containerW - displayedWidth) / 2;
        const offsetY = (containerH - displayedHeight) / 2;

        // Base sticker size - fixed at 96px to match DraggableSticker's w-24 (6rem = 96px)
        const baseSizePx = 96;

        for (const sticker of stickers) {
          if (!sticker.imageUrl) continue;

          // Decode image bytes from data URL or remote URL
          let imgBytes: Uint8Array;
          if (sticker.imageUrl.startsWith('data:')) {
            const base64 = sticker.imageUrl.split(',')[1];
            imgBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
          } else {
            const resp = await fetch(sticker.imageUrl);
            if (!resp.ok) throw new Error(`Failed to fetch sticker: ${sticker.imageUrl}`);
            imgBytes = new Uint8Array(await resp.arrayBuffer());
          }

          // Embed image — try PNG first, fall back to JPEG with explicit try/catch
          let embeddedImg;
          try {
            embeddedImg = await pdfDoc.embedPng(imgBytes);
          } catch {
            try {
              embeddedImg = await pdfDoc.embedJpg(imgBytes);
            } catch (embedErr) {
              console.warn(`Skipping sticker ${sticker.instanceId}: could not embed image`, embedErr);
              continue;
            }
          }

          // Get the actual dimensions of the embedded image
          const imgDims = embeddedImg.scale(1);
          const imgAspectRatio = imgDims.width / imgDims.height;

          // DraggableSticker uses w-24 h-24 (96×96 unscaled) with object-contain and scale transform
          // The scale transform has transform-origin: center, so scaling shifts the visual position

          // Step 1: Calculate unscaled image dimensions (object-contain within 96×96)
          let unscaledW, unscaledH;
          if (imgAspectRatio > 1) {
            unscaledW = baseSizePx;
            unscaledH = baseSizePx / imgAspectRatio;
          } else {
            unscaledH = baseSizePx;
            unscaledW = baseSizePx * imgAspectRatio;
          }

          // Step 2: Account for transform-origin: center
          // The container (96×96) is at (sticker.x, sticker.y), then scaled from its center
          // Center of unscaled container: (sticker.x + 48, sticker.y + 48)
          // After scaling, container is (96s × 96s), center stays the same
          // New top-left of container: center - (96s / 2, 96s / 2)
          const scaledContainerHalf = (baseSizePx * sticker.scale) / 2;
          const unscaledContainerHalf = baseSizePx / 2;
          const containerOffsetX = unscaledContainerHalf - scaledContainerHalf;
          const containerOffsetY = unscaledContainerHalf - scaledContainerHalf;

          // Adjusted sticker position (top-left of scaled container)
          const adjustedX = sticker.x - containerOffsetX;
          const adjustedY = sticker.y - containerOffsetY;

          // Step 3: Calculate where the image sits within the scaled container (centered due to object-contain)
          const scaledW = unscaledW * sticker.scale;
          const scaledH = unscaledH * sticker.scale;
          const imageOffsetX = (baseSizePx * sticker.scale - scaledW) / 2;
          const imageOffsetY = (baseSizePx * sticker.scale - scaledH) / 2;

          // Final image position in display coordinates
          const imageX = adjustedX + imageOffsetX;
          const imageY = adjustedY + imageOffsetY;

          // Convert to coordinates relative to the displayed PDF image
          const displayX = imageX - offsetX;
          const displayY = imageY - offsetY;

          // Convert from display coordinates to PNG coordinates
          const pngX = displayX / imgScale;
          const pngY = displayY / imgScale;

          // Convert from PNG coordinates to PDF coordinates
          // PNG is 2x the PDF size, so divide by 2
          const pdfX = pngX / 2;
          // PDF origin is bottom-left; display origin is top-left
          const pdfY = pdfH - (pngY / 2) - (scaledH / imgScale / 2);

          // Size in PDF coordinates
          const pdfStickerW = scaledW / imgScale / 2;
          const pdfStickerH = scaledH / imgScale / 2;

          page.drawImage(embeddedImg, {
            x: pdfX,
            y: pdfY,
            width: pdfStickerW,
            height: pdfStickerH,
          });
        }
      }

      const outputBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(outputBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `signed-${fileName || 'document.pdf'}`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed — please try again.');
    }

    setIsExporting(false);
  }, [pdfBytes, pageStickers, fileName]);

  // Get current page aspect ratio
  const currentPageAspectRatio = pageDimensions[currentPage]
    ? `${pageDimensions[currentPage].width} / ${pageDimensions[currentPage].height}`
    : '210 / 297'; // fallback to A4 portrait

  // ── Upload screen ────────────────────────────────────────────────────────────
  if (!pdfBytes) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <label className="flex flex-col items-center gap-3 px-8 py-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary hover:bg-accent/50 transition-colors">
          <Upload className="w-10 h-10 text-muted-foreground" />
          <span className="text-sm font-handwriting-patrick text-muted-foreground">
            Upload PDF or Document
          </span>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>
    );
  }

  // ── Loading screen ───────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-sm font-handwriting-patrick text-muted-foreground animate-pulse">
          Loading document...
        </div>
      </div>
    );
  }

  // ── Main editor ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full max-w-5xl mx-auto p-4">
      {/* Side controls */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full lg:w-48 flex flex-row lg:flex-col gap-2 bg-card rounded-xl p-3 paper-shadow overflow-x-auto flex-shrink-0"
      >
        <button
          onClick={() => setIsDrawing(true)}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-accent text-accent-foreground font-handwriting-patrick text-sm hover:opacity-90 transition-opacity whitespace-nowrap lg:w-full"
        >
          <Pencil className="w-4 h-4" />
          Draw Signature
        </button>

        <button
          onClick={exportPdf}
          disabled={isExporting}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground font-handwriting-patrick text-sm hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap lg:w-full"
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'Exporting…' : 'Save as PDF'}
        </button>

        <button
          onClick={resetDocument}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-secondary text-secondary-foreground font-handwriting-patrick text-sm hover:bg-secondary/80 transition-colors whitespace-nowrap lg:w-full"
        >
          <RotateCcw className="w-4 h-4" />
          New Document
        </button>

        {/* Page counter */}
        <div className="flex items-center gap-2 lg:mt-auto">
          <span className="text-xs font-handwriting-patrick text-muted-foreground whitespace-nowrap">
            Page {currentPage + 1} / {pageImages.length}
          </span>
        </div>
      </motion.div>

      {/* Document view */}
      <div className="flex-1 flex flex-col items-center gap-3">
        {/* Page navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="p-2 rounded-lg bg-secondary text-secondary-foreground disabled:opacity-30 hover:bg-secondary/80 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-handwriting-patrick text-muted-foreground">
            {fileName}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(pageImages.length - 1, p + 1))}
            disabled={currentPage >= pageImages.length - 1}
            className="p-2 rounded-lg bg-secondary text-secondary-foreground disabled:opacity-30 hover:bg-secondary/80 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas with PDF page */}
        <div
          ref={canvasRef}
          className="relative w-full max-w-lg bg-white rounded-lg overflow-hidden paper-shadow"
          style={{ aspectRatio: currentPageAspectRatio }}
        >
          {pageImages[currentPage] && (
            <img
              src={pageImages[currentPage]}
              alt={`Page ${currentPage + 1}`}
              className="w-full h-full object-contain select-none pointer-events-none"
              draggable={false}
            />
          )}

          {currentStickers.map(sticker => (
            <DraggableSticker
              key={sticker.instanceId}
              sticker={sticker}
              onUpdate={updateSticker}
              onDelete={deleteSticker}
              containerRef={canvasRef}
            />
          ))}
        </div>

        {/* Page thumbnails */}
        {pageImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto py-2 max-w-full">
            {pageImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`flex-shrink-0 w-12 h-16 rounded border-2 overflow-hidden transition-all ${
                  i === currentPage
                    ? 'border-primary scale-105'
                    : 'border-border opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Page ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Drawing Canvas Modal */}
      {isDrawing && (
        <DrawingCanvas
          onSave={dataUrl => {
            addDrawnSticker(dataUrl);
            setIsDrawing(false);
          }}
          onClose={() => setIsDrawing(false)}
        />
      )}
    </div>
  );
};

export default PdfSigner;