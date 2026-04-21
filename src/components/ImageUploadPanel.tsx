import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';

interface ImageUploadPanelProps {
  onAddImageSticker: (imageUrl: string) => void;
}

const OUTPUT_MAX_SIZE = 2400;

const isHeic = (file: File): boolean =>
  file.type === 'image/heic' ||
  file.type === 'image/heif' ||
  /\.(heic|heif)$/i.test(file.name);

const resizeBitmapToDataUrl = (bitmap: ImageBitmap, maxSize = OUTPUT_MAX_SIZE): string => {
  let { width, height } = bitmap;
  if (width > maxSize || height > maxSize) {
    const ratio = Math.min(maxSize / width, maxSize / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return canvas.toDataURL('image/png');
};

const resizeImgToDataUrl = (img: HTMLImageElement, maxSize = OUTPUT_MAX_SIZE): string => {
  let { width, height } = img;
  if (width > maxSize || height > maxSize) {
    const ratio = Math.min(maxSize / width, maxSize / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/png');
};

/** Fast path: use native browser decoding via createImageBitmap */
const tryNativeDecode = async (blob: Blob): Promise<string | null> => {
  try {
    const bitmap = await createImageBitmap(blob);
    return resizeBitmapToDataUrl(bitmap);
  } catch {
    return null;
  }
};

/** Fast path: try loading via <img> element (works for HEIC in Safari 17+) */
const tryImgDecode = (blob: Blob): Promise<string | null> =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(resizeImgToDataUrl(img));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });

/** Slow fallback: heic2any JS decoder */
const heicFallback = async (file: File): Promise<string> => {
  const heic2any = (await import('heic2any')).default as (opts: {
    blob: Blob;
    toType: string;
    quality: number;
  }) => Promise<Blob | Blob[]>;
  const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
  const jpeg = Array.isArray(result) ? result[0] : result;
  // Now decode the resulting JPEG natively
  const decoded = await tryNativeDecode(jpeg) ?? await tryImgDecode(jpeg);
  if (!decoded) throw new Error('Could not decode converted image');
  return decoded;
};

const decodeImage = async (
  file: File,
  onSlowPath: () => void
): Promise<string> => {
  // 1. Try native decoding first (instant on modern browsers / Safari for HEIC)
  const native = await tryNativeDecode(file);
  if (native) return native;

  // 2. Try <img> element (Safari 17+ handles HEIC this way)
  const img = await tryImgDecode(file);
  if (img) return img;

  // 3. Only reach here for HEIC on non-Safari browsers — warn user it'll be slow
  if (isHeic(file)) {
    onSlowPath();
    return heicFallback(file);
  }

  throw new Error('Browser could not decode image');
};

const ImageUploadPanel = ({ onAddImageSticker }: ImageUploadPanelProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Loading…');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;

    const looksLikeImage =
      file.type.startsWith('image/') ||
      /\.(jpe?g|png|gif|webp|heic|heif|bmp|tiff?|avif)$/i.test(file.name);

    if (!looksLikeImage) {
      setError('Please choose an image file.');
      return;
    }

    setError(null);
    setIsLoading(true);
    setLoadingMsg('Loading…');

    try {
      const dataUrl = await decodeImage(file, () =>
        setLoadingMsg('Converting… (this may take a moment)')
      );
      setPreviewUrl(dataUrl);
      onAddImageSticker(dataUrl);
    } catch (err) {
      console.error(err);
      setError('Could not read image. Please try another file.');
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setPreviewUrl(null);
    setError(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-handwriting-patrick text-muted-foreground tracking-wide uppercase">
        📷 Upload Image
      </h3>

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-border bg-secondary/50 text-secondary-foreground font-handwriting-patrick text-sm hover:bg-secondary/80 transition-colors disabled:opacity-50"
      >
        <Upload className="w-4 h-4" />
        {isLoading ? loadingMsg : 'Choose Image'}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        onChange={handleFileChange}
        className="hidden"
      />

      {error && (
        <p className="text-xs text-destructive font-handwriting-patrick">{error}</p>
      )}

      {previewUrl && !isLoading && (
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