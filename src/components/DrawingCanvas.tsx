import { useRef, useState, useCallback, useEffect } from 'react';
import { Eraser, Undo2, Trash2, Check, X } from 'lucide-react';

interface DrawingCanvasProps {
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

const COLORS = [
  { id: 'black', css: 'hsl(220, 20%, 15%)' },
  { id: 'blue', css: 'hsl(215, 60%, 35%)' },
  { id: 'red', css: 'hsl(0, 70%, 50%)' },
  { id: 'green', css: 'hsl(140, 50%, 45%)' },
  { id: 'purple', css: 'hsl(270, 50%, 45%)' },
  { id: 'orange', css: 'hsl(30, 80%, 50%)' },
  { id: 'pink', css: 'hsl(330, 70%, 55%)' },
];

const SIZES = [2, 4, 6, 10];

const DrawingCanvas = ({ onSave, onClose }: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0].css);
  const [lineWidth, setLineWidth] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const historyRef = useRef<ImageData[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveHistory();
  }, []);

  const saveHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    historyRef.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (historyRef.current.length > 30) historyRef.current.shift();
  }, []);

  const getPos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = lineWidth * (isEraser ? 4 : 1);
    ctx.strokeStyle = color;
    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveHistory();
  };

  const undo = () => {
    const canvas = canvasRef.current;
    if (!canvas || historyRef.current.length <= 1) return;
    historyRef.current.pop();
    const ctx = canvas.getContext('2d')!;
    const prev = historyRef.current[historyRef.current.length - 1];
    ctx.putImageData(prev, 0, 0);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveHistory();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Trim transparent space and export
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = imageData;

    let minX = width, minY = height, maxX = 0, maxY = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 0) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if (maxX < minX) {
      // Empty canvas
      return;
    }

    const pad = 8;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(width - 1, maxX + pad);
    maxY = Math.min(height - 1, maxY + pad);

    const trimW = maxX - minX + 1;
    const trimH = maxY - minY + 1;
    const trimmed = ctx.getImageData(minX, minY, trimW, trimH);

    const tmpCanvas = document.createElement('canvas');
    tmpCanvas.width = trimW;
    tmpCanvas.height = trimH;
    tmpCanvas.getContext('2d')!.putImageData(trimmed, 0, 0);

    onSave(tmpCanvas.toDataURL('image/png'));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl shadow-2xl flex flex-col gap-3 p-4 w-full max-w-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-handwriting-patrick text-lg text-foreground">Draw a Sticker</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Canvas */}
        <div className="rounded-lg border-2 border-border bg-white overflow-hidden touch-none"
          style={{ aspectRatio: '1' }}
        >
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="w-full h-full cursor-crosshair"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
        </div>

        {/* Color picker */}
        <div className="flex items-center gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c.id}
              onClick={() => { setColor(c.css); setIsEraser(false); }}
              className="w-7 h-7 rounded-full border-2 transition-transform active:scale-90"
              style={{
                backgroundColor: c.css,
                borderColor: color === c.css && !isEraser ? 'hsl(var(--primary))' : 'transparent',
                transform: color === c.css && !isEraser ? 'scale(1.15)' : 'scale(1)',
              }}
            />
          ))}
          <button
            onClick={() => setIsEraser(!isEraser)}
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${
              isEraser ? 'border-primary bg-primary/10' : 'border-border bg-muted'
            }`}
          >
            <Eraser className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {/* Size picker */}
        <div className="flex items-center gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setLineWidth(s)}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all active:scale-90 ${
                lineWidth === s ? 'bg-primary/15 border border-primary' : 'bg-muted border border-transparent'
              }`}
            >
              <div
                className="rounded-full bg-foreground"
                style={{ width: s + 2, height: s + 2 }}
              />
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button onClick={undo} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm font-handwriting-patrick hover:bg-muted/80 transition-colors active:scale-95">
            <Undo2 className="w-4 h-4" /> Undo
          </button>
          <button onClick={clearCanvas} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm font-handwriting-patrick hover:bg-muted/80 transition-colors active:scale-95">
            <Trash2 className="w-4 h-4" /> Clear
          </button>
          <div className="flex-1" />
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-handwriting-patrick hover:opacity-90 transition-opacity active:scale-95"
          >
            <Check className="w-4 h-4" /> Save Sticker
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrawingCanvas;
