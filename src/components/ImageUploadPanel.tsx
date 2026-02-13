import { useState, useRef } from 'react';
import { Upload, Loader2, ImageOff } from 'lucide-react';
import { removeBackground } from '@imgly/background-removal';

interface ImageUploadPanelProps {
  onAddImageSticker: (imageUrl: string) => void;
}

// Convert a blob/file to a data URL and optionally resize large images
const toDataUrl = (source: Blob | File, maxSize = 800): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Resize if too large
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
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(source);
  });
};

const ImageUploadPanel = ({ onAddImageSticker }: ImageUploadPanelProps) => {
  const [removeBg, setRemoveBg] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) return;

    setIsProcessing(true);
    setPreviewUrl(null);

    try {
      if (removeBg) {
        const blob = await removeBackground(file, {
          output: { format: 'image/png' },
        });
        const dataUrl = await toDataUrl(blob);
        setPreviewUrl(dataUrl);
        onAddImageSticker(dataUrl);
      } else {
        const dataUrl = await toDataUrl(file);
        setPreviewUrl(dataUrl);
        onAddImageSticker(dataUrl);
      }
    } catch (err) {
      console.error('Image processing failed:', err);
      const dataUrl = await toDataUrl(file);
      setPreviewUrl(dataUrl);
      onAddImageSticker(dataUrl);
    }

    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-handwriting-patrick text-muted-foreground tracking-wide uppercase">
        📷 Upload Cutout
      </h3>

      {/* Remove BG toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={removeBg}
          onChange={(e) => setRemoveBg(e.target.checked)}
          className="accent-primary w-4 h-4 rounded"
        />
        <span className="text-xs font-handwriting-patrick text-muted-foreground flex items-center gap-1">
          <ImageOff className="w-3 h-3" />
          Remove background
        </span>
      </label>

      {/* Upload button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-border bg-secondary/50 text-secondary-foreground font-handwriting-patrick text-sm hover:bg-secondary/80 transition-colors disabled:opacity-50"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Choose Image
          </>
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Preview */}
      {previewUrl && (
        <div className="relative w-16 h-16 mx-auto rounded-md overflow-hidden border border-border bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]">
          <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
        </div>
      )}

      {isProcessing && (
        <p className="text-[10px] font-handwriting-patrick text-muted-foreground text-center">
          First time may take a moment to download the AI model...
        </p>
      )}
    </div>
  );
};

export default ImageUploadPanel;
