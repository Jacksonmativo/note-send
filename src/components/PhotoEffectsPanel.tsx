import { PHOTO_FRAMES, PHOTO_FILTERS, PHOTO_EFFECTS } from './PhotoEffectsData';
import type { PlacedSticker } from './DraggableSticker';

interface PhotoEffectsPanelProps {
  sticker: PlacedSticker;
  onUpdate: (updated: PlacedSticker) => void;
  onClose: () => void;
}

const PhotoEffectsPanel = ({ sticker, onUpdate, onClose }: PhotoEffectsPanelProps) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-card rounded-xl shadow-2xl flex flex-col gap-3 p-4 w-full max-w-xs max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-handwriting-patrick text-lg text-foreground">Photo Effects</h3>

        {/* Preview */}
        <div className="relative w-full aspect-square rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
          <div className={`relative w-full h-full photo-frame-${sticker.photoFrame || 'none'}`}>
            <img
              src={sticker.imageUrl}
              alt="Preview"
              className="w-full h-full object-contain"
              style={{ filter: sticker.photoFilter || 'none' }}
            />
            {sticker.photoEffect && sticker.photoEffect !== 'none' && (
              <div className={`absolute inset-0 pointer-events-none photo-effect-${sticker.photoEffect}`} />
            )}
          </div>
        </div>

        {/* Frames */}
        <div>
          <p className="text-xs font-handwriting-patrick text-muted-foreground uppercase tracking-wide mb-1.5">🖼️ Frames</p>
          <div className="grid grid-cols-4 gap-1.5">
            {PHOTO_FRAMES.map((frame) => (
              <button
                key={frame.id}
                onClick={() => onUpdate({ ...sticker, photoFrame: frame.id })}
                className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-xs transition-all active:scale-95 ${
                  (sticker.photoFrame || 'none') === frame.id
                    ? 'bg-primary/15 border border-primary'
                    : 'bg-muted border border-transparent hover:bg-muted/80'
                }`}
              >
                <span className="text-base">{frame.emoji}</span>
                <span className="font-handwriting-patrick text-[10px] text-foreground leading-tight">{frame.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div>
          <p className="text-xs font-handwriting-patrick text-muted-foreground uppercase tracking-wide mb-1.5">🎨 Filters</p>
          <div className="grid grid-cols-3 gap-1.5">
            {PHOTO_FILTERS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => onUpdate({ ...sticker, photoFilter: filter.css === 'none' ? undefined : filter.css })}
                className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-xs transition-all active:scale-95 ${
                  (sticker.photoFilter || 'none') === filter.css
                    ? 'bg-primary/15 border border-primary'
                    : 'bg-muted border border-transparent hover:bg-muted/80'
                }`}
              >
                <div
                  className="w-8 h-8 rounded overflow-hidden border border-border"
                >
                  <img
                    src={sticker.imageUrl}
                    alt={filter.label}
                    className="w-full h-full object-cover"
                    style={{ filter: filter.css }}
                  />
                </div>
                <span className="font-handwriting-patrick text-[10px] text-foreground leading-tight">{filter.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Effects */}
        <div>
          <p className="text-xs font-handwriting-patrick text-muted-foreground uppercase tracking-wide mb-1.5">📼 Effects</p>
          <div className="grid grid-cols-4 gap-1.5">
            {PHOTO_EFFECTS.map((effect) => (
              <button
                key={effect.id}
                onClick={() => onUpdate({ ...sticker, photoEffect: effect.id === 'none' ? undefined : effect.id })}
                className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg text-xs transition-all active:scale-95 ${
                  (sticker.photoEffect || 'none') === effect.id
                    ? 'bg-primary/15 border border-primary'
                    : 'bg-muted border border-transparent hover:bg-muted/80'
                }`}
              >
                <span className="text-base">{effect.emoji}</span>
                <span className="font-handwriting-patrick text-[10px] text-foreground leading-tight">{effect.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground font-handwriting-patrick text-sm hover:opacity-90 transition-opacity"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default PhotoEffectsPanel;
