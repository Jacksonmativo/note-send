import { INK_COLORS, FONT_OPTIONS, type InkColor } from './StickerData';

interface TextControlsProps {
  inkColor: InkColor;
  fontFamily: string;
  fontSize: number;
  onInkChange: (color: InkColor) => void;
  onFontChange: (font: string) => void;
  onSizeChange: (size: number) => void;
}

const TextControls = ({
  inkColor,
  fontFamily,
  fontSize,
  onInkChange,
  onFontChange,
  onSizeChange,
}: TextControlsProps) => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-handwriting-patrick text-muted-foreground tracking-wide uppercase">
        ✍️ Writing
      </h3>

      {/* Ink Colors */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground font-handwriting-patrick">Ink Color</span>
        <div className="flex gap-2">
          {INK_COLORS.map((c) => {
            const colorMap: Record<string, string> = {
              blue: 'hsl(215, 60%, 35%)',
              black: 'hsl(220, 20%, 15%)',
              red: 'hsl(0, 70%, 50%)',
              green: 'hsl(140, 60%, 30%)',
            };
            return (
              <button
                key={c.id}
                onClick={() => onInkChange(c.id)}
                className={`w-7 h-7 rounded-full border-2 transition-all ${
                  inkColor === c.id ? 'border-foreground scale-110' : 'border-border'
                }`}
                style={{ background: colorMap[c.id] }}
                title={c.label}
              />
            );
          })}
        </div>
      </div>

      {/* Fonts */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground font-handwriting-patrick">Font</span>
        <div className="flex flex-col gap-1">
          {FONT_OPTIONS.map((f) => (
            <button
              key={f.id}
              onClick={() => onFontChange(f.id)}
              className={`px-3 py-1 rounded-md text-sm text-left transition-all ${f.className} ${
                fontFamily === f.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground font-handwriting-patrick">Size</span>
        <input
          type="range"
          min={16}
          max={36}
          value={fontSize}
          onChange={(e) => onSizeChange(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </div>
    </div>
  );
};

export default TextControls;
