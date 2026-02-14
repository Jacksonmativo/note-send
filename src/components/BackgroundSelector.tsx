import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
import bgTornAutumn from '@/assets/bg-torn-autumn.jpg';
import bgMeadowFrame from '@/assets/bg-meadow-frame.jpg';
import bgRoadClip from '@/assets/bg-road-clip.jpg';
import bgLaptopHeart from '@/assets/bg-laptop-heart.jpg';
import bgAestheticDesk from '@/assets/bg-aesthetic-desk.jpg';
import bgPhoneHand from '@/assets/bg-phone-hand.jpg';
import bgLeafNotebook from '@/assets/bg-leaf-notebook.jpg';
import bgCleanPaper from '@/assets/bg-clean-paper.jpg';

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
  { id: 'torn-autumn', label: 'Autumn', src: bgTornAutumn },
  { id: 'meadow-frame', label: 'Meadow', src: bgMeadowFrame },
  { id: 'road-clip', label: 'Road', src: bgRoadClip },
  { id: 'laptop-heart', label: 'Laptop', src: bgLaptopHeart },
  { id: 'aesthetic-desk', label: 'Desk', src: bgAestheticDesk },
  { id: 'phone-hand', label: 'Phone', src: bgPhoneHand },
  { id: 'leaf-notebook', label: 'Leaves', src: bgLeafNotebook },
  { id: 'clean-paper', label: 'Clean', src: bgCleanPaper },
];

interface BackgroundSelectorProps {
  selected: string;
  onSelect: (id: string) => void;
}

const BackgroundSelector = ({ selected, onSelect }: BackgroundSelectorProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -120 : 120, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-handwriting-patrick text-muted-foreground tracking-wide uppercase">
        🖼️ Background
      </h3>
      <div className="relative">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-card/80 backdrop-blur-sm rounded-full p-0.5 shadow hover:bg-card transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>
        <div
          ref={scrollRef}
          className="flex gap-1.5 overflow-x-auto scrollbar-hide px-6 py-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {backgrounds.map((bg) => (
            <button
              key={bg.id}
              onClick={() => onSelect(bg.id)}
              className={`relative flex-shrink-0 w-12 h-16 rounded-md overflow-hidden border-2 transition-all ${
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
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-card/80 backdrop-blur-sm rounded-full p-0.5 shadow hover:bg-card transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-foreground" />
        </button>
      </div>
    </div>
  );
};

export default BackgroundSelector;
