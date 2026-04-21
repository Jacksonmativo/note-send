import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';

interface ImageUploadPanelProps {
  onAddImageSticker: (imageUrl: string) => void;
}

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

const ImageUploadPanel = ({ onAddImageSticker }: ImageUploadPanelProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (!file) return;

    // Accept any image/* type; also allow common camera formats that may
    // come through with an empty or non-standard MIME type on some devices.
    const looksLikeImage =
      file.type.startsWith('image/') ||
      /\.(jpe?g|png|gif|webp|heic|heif|bmp|tiff?|avif)$/i.test(file.name);

    if (!looksLikeImage) {
      setError('Please choose an image file.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          const result = resizeToDataUrl(img, OUTPUT_MAX_SIZE);
          URL.revokeObjectURL(objectUrl);
          resolve(result);
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Failed to load image'));
        };
        img.src = objectUrl;
      });

      setPreviewUrl(dataUrl);
      onAddImageSticker(dataUrl);
    } catch {
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
        {isLoading ? 'Loading…' : 'Choose Image'}
      </button>

      {/* Hidden file input — no size limit, accepts all image types */}
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

      {/* Thumbnail of last added image */}
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