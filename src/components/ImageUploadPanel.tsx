import { useState, useRef, useCallback } from 'react';
import { Upload, Check, X } from 'lucide-react';

interface ImageUploadPanelProps {
  onAddImageSticker: (imageUrl: string) => void;
}

const MAX_FILE_MB = 50;
const OUTPUT_MAX_SIZE = 2400;

const resizeToDataUrl = (img: HTMLImageElement, maxSize = OUTPUT_MAX_SIZE): string => {
  let { width, height } = img;
  if (width > maxSize || height > maxSize) {
    const ratio = Math.min(maxSize / width, maxSize / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/png');
};

const loadImageFromFile = (file: File): Promise<{ img: HTMLImageElement; objectUrl: string }> => {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, objectUrl });
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
    img.src = objectUrl;
  });
};

const ImageUploadPanel = ({ onAddImageSticker }: ImageUploadPanelProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const cropAreaRef = useRef<HTMLDivElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, w: 80, h: 80 }); // percentages
  const [dragState, setDragState] = useState<null | {
    type: 'move' | 'resize';
    startX: number;
    startY: number;
    startCrop: typeof cropBox;
  }>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`File too large. Maximum size is ${MAX_FILE_MB}MB.`);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const { img, objectUrl } = await loadImageFromFile(file);

      // Use a resized data URL as preview so the crop canvas renders correctly
      // and we don't hold a large object URL open during the crop interaction.
      const dataUrl = resizeToDataUrl(img, OUTPUT_MAX_SIZE);
      URL.revokeObjectURL(objectUrl);

      setPreviewUrl(dataUrl);
      setIsCropping(true);
      setCropBox({ x: 10, y: 10, w: 80, h: 80 });
    } catch {
      setError('Could not read image. Please try another file.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRelativePos = useCallback((clientX: number, clientY: number) => {
    const area = cropAreaRef.current;
    if (!area) return { px: 0, py: 0 };
    const rect = area.getBoundingClientRect();
    return {
      px: ((clientX - rect.left) / rect.width) * 100,
      py: ((clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, type: 'move' | 'resize') => {
      e.preventDefault();
      e.stopPropagation();
      const { px, py } = getRelativePos(e.clientX, e.clientY);
      setDragState({ type, startX: px, startY: py, startCrop: { ...cropBox } });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [cropBox, getRelativePos]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragState) return;
      const { px, py } = getRelativePos(e.clientX, e.clientY);
      const dx = px - dragState.startX;
      const dy = py - dragState.startY;
      const s = dragState.startCrop;

      if (dragState.type === 'move') {
        const newX = Math.max(0, Math.min(100 - s.w, s.x + dx));
        const newY = Math.max(0, Math.min(100 - s.h, s.y + dy));
        setCropBox({ ...s, x: newX, y: newY });
      } else {
        const newW = Math.max(10, Math.min(100 - s.x, s.w + dx));
        const newH = Math.max(10, Math.min(100 - s.y, s.h + dy));
        setCropBox({ ...s, w: newW, h: newH });
      }
    },
    [dragState, getRelativePos]
  );

  const handlePointerUp = useCallback(() => {
    setDragState(null);
  }, []);

  const applyCrop = useCallback(() => {
    if (!previewUrl) return;
    const img = imgRef.current;
    if (!img) return;

    const sx = (cropBox.x / 100) * img.naturalWidth;
    const sy = (cropBox.y / 100) * img.naturalHeight;
    const sw = (cropBox.w / 100) * img.naturalWidth;
    const sh = (cropBox.h / 100) * img.naturalHeight;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    const croppedUrl = canvas.toDataURL('image/png');
    onAddImageSticker(croppedUrl);
    setIsCropping(false);
    setPreviewUrl(croppedUrl);
  }, [previewUrl, cropBox, onAddImageSticker]);

  const cancelCrop = () => {
    setIsCropping(false);
    setPreviewUrl(null);
    setError(null);
  };

  const reset = () => {
    setPreviewUrl(null);
    setIsCropping(false);
    setError(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-handwriting-patrick text-muted-foreground tracking-wide uppercase">
        📷 Upload Image
      </h3>

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isCropping || isLoading}
        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-border bg-secondary/50 text-secondary-foreground font-handwriting-patrick text-sm hover:bg-secondary/80 transition-colors disabled:opacity-50"
      >
        <Upload className="w-4 h-4" />
        {isLoading ? 'Loading…' : 'Choose Image'}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Error message */}
      {error && (
        <p className="text-xs text-destructive font-handwriting-patrick">{error}</p>
      )}

      {/* Crop UI */}
      {isCropping && previewUrl && (
        <div className="flex flex-col gap-2">
          <div
            ref={cropAreaRef}
            className="relative w-full aspect-square rounded-md overflow-hidden border border-border bg-muted select-none"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <img
              ref={imgRef}
              src={previewUrl}
              alt="Crop preview"
              className="w-full h-full object-contain"
              draggable={false}
            />

            {/* Dimming overlay — four surrounding quadrants */}
            {/* Left */}
            <div
              className="absolute inset-y-0 left-0 bg-black/50 pointer-events-none"
              style={{ width: `${cropBox.x}%` }}
            />
            {/* Right */}
            <div
              className="absolute inset-y-0 right-0 bg-black/50 pointer-events-none"
              style={{ width: `${100 - cropBox.x - cropBox.w}%` }}
            />
            {/* Top (between left and right) */}
            <div
              className="absolute top-0 bg-black/50 pointer-events-none"
              style={{
                left: `${cropBox.x}%`,
                width: `${cropBox.w}%`,
                height: `${cropBox.y}%`,
              }}
            />
            {/* Bottom (between left and right) */}
            <div
              className="absolute bottom-0 bg-black/50 pointer-events-none"
              style={{
                left: `${cropBox.x}%`,
                width: `${cropBox.w}%`,
                height: `${100 - cropBox.y - cropBox.h}%`,
              }}
            />

            {/* Crop selection box */}
            <div
              className="absolute border-2 border-white cursor-move"
              style={{
                left: `${cropBox.x}%`,
                top: `${cropBox.y}%`,
                width: `${cropBox.w}%`,
                height: `${cropBox.h}%`,
              }}
              onPointerDown={(e) => handlePointerDown(e, 'move')}
            >
              {/* Corner rule-of-thirds guides */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="border border-white/20" />
                ))}
              </div>

              {/* Resize handle */}
              <div
                className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white rounded-full border border-primary cursor-nwse-resize"
                onPointerDown={(e) => handlePointerDown(e, 'resize')}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={applyCrop}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-handwriting-patrick text-sm hover:opacity-90 transition-opacity"
            >
              <Check className="w-3 h-3" />
              Crop & Add
            </button>
            <button
              onClick={cancelCrop}
              className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-handwriting-patrick text-sm hover:bg-secondary/80 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Thumbnail of last added image */}
      {!isCropping && previewUrl && (
        <div className="flex flex-col items-center gap-1">
          <div className="relative w-16 h-16 rounded-md overflow-hidden border border-border bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]">
            <img src={previewUrl} alt="Last added sticker" className="w-full h-full object-contain" />
          </div>
          <button
            onClick={reset}
            className="text-xs text-muted-foreground hover:text-foreground font-handwriting-patrick transition-colors"
          >
            Upload another
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUploadPanel;