import bgNotebook from '@/assets/notebook-bg.jpg';
import bgRosesWood from '@/assets/bg-roses-wood.jpg';
import bgRosePetals from '@/assets/bg-rose-petals.jpg';
import bgHearts from '@/assets/bg-hearts-couple.jpg';
import bgCoffee from '@/assets/bg-coffee-roses.jpg';
import bgCollegeRuled from '@/assets/bg-college-ruled.jpg';
import bgFloralPink from '@/assets/bg-floral-pink.jpg';
import bgRoseNote from '@/assets/bg-rose-note.jpg';
import bgWhiteTulips from '@/assets/bg-white-tulips.jpg';
import bgHeartBow from '@/assets/bg-heart-bow.jpg';
import bgFadedRose from '@/assets/bg-faded-rose.jpg';
import bgPinkRoseBow from '@/assets/bg-pink-rose-bow.jpg';
import bgPinkRoses from '@/assets/bg-pink-roses.jpg';
import bgFlowerLeaf from '@/assets/bg-flower-leaf.jpg';
import bgBlossomNotebook from '@/assets/bg-blossom-notebook.jpg';
import bgPensFlowers from '@/assets/bg-pens-flowers.jpg';

export interface BackgroundOption {
  id: string;
  label: string;
  src: string;
}

export const backgrounds: BackgroundOption[] = [
  { id: 'notebook', label: 'Notebook', src: bgNotebook },
  { id: 'roses-wood', label: 'Roses', src: bgRosesWood },
  { id: 'rose-petals', label: 'Petals', src: bgRosePetals },
  { id: 'hearts', label: 'Hearts', src: bgHearts },
  { id: 'coffee', label: 'Coffee', src: bgCoffee },
  { id: 'college', label: 'Lined', src: bgCollegeRuled },
  { id: 'floral', label: 'Floral', src: bgFloralPink },
  { id: 'rose-note', label: 'Rose Note', src: bgRoseNote },
  { id: 'white-tulips', label: 'Tulips', src: bgWhiteTulips },
  { id: 'heart-bow', label: 'Heart Bow', src: bgHeartBow },
  { id: 'faded-rose', label: 'Faded Rose', src: bgFadedRose },
  { id: 'pink-rose-bow', label: 'Pink Bow', src: bgPinkRoseBow },
  { id: 'pink-roses', label: 'Pink Roses', src: bgPinkRoses },
  { id: 'flower-leaf', label: 'Daisy', src: bgFlowerLeaf },
  { id: 'blossom-notebook', label: 'Blossom', src: bgBlossomNotebook },
  { id: 'pens-flowers', label: 'Pens', src: bgPensFlowers },
];

interface BackgroundSelectorProps {
  selected: string;
  onSelect: (id: string) => void;
}

const BackgroundSelector = ({ selected, onSelect }: BackgroundSelectorProps) => {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-handwriting-patrick text-muted-foreground tracking-wide uppercase">
        🖼️ Background
      </h3>
      <div className="grid grid-cols-4 gap-1.5">
        {backgrounds.map((bg) => (
          <button
            key={bg.id}
            onClick={() => onSelect(bg.id)}
            className={`relative w-full aspect-[3/4] rounded-md overflow-hidden border-2 transition-all ${
              selected === bg.id
                ? 'border-primary ring-1 ring-primary'
                : 'border-border hover:border-muted-foreground/50'
            }`}
            title={bg.label}
          >
            <img
              src={bg.src}
              alt={bg.label}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default BackgroundSelector;
