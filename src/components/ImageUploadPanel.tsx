import { useState, useRef } from 'react';
import { Upload, Loader2, ImageOff } from 'lucide-react';
import { removeBackground } from '@imgly/background-removal';

interface ImageUploadPanelProps {
  onAddImageSticker: (imageUrl: string) => void;
}

const ImageUploadPanel = ({ onAddImageSticker }: ImageUploadPanelProps) => {
  const [removeBg, setRemoveBg] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) return;

    setIsProcessing(true);
    setPreviewUrl(null);

    try {
      if (removeBg) {
        const blob = await removeBackground(file, {
          output: { format: 'image/png' },
        });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        onAddImageSticker(url);
      } else {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        onAddImageSticker(url);
      }
    } catch (err) {
      console.error('Image processing failed:', err);
      // Fallback: use original image
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onAddImageSticker(url);
    }

    setIsProcessing(false);
    // Reset input
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
