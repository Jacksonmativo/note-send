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
import bgBouquetRibbon from '@/assets/bg-bouquet-ribbon.jpg';
import bgCraftClip from '@/assets/bg-craft-clip.jpg';
import bgTornEdge from '@/assets/bg-torn-edge.jpg';
import bgRippedWhite from '@/assets/bg-ripped-white.jpg';
import bgBinderClip from '@/assets/bg-binder-clip.jpg';
import bgPinnedPaper from '@/assets/bg-pinned-paper.jpg';
import bgTapedTorn from '@/assets/bg-taped-torn.jpg';
import bgDeskNotebook from '@/assets/bg-desk-notebook.jpg';
import bgBlossomPen from '@/assets/bg-blossom-pen.jpg';
import bgTornCork from '@/assets/bg-torn-cork.jpg';
import bgHeartTape from '@/assets/bg-heart-tape.jpg';
import bgCozyKnit from '@/assets/bg-cozy-knit.jpg';
import bgSilkCoffee from '@/assets/bg-silk-coffee.jpg';
import bgPeachNotebook from '@/assets/bg-peach-notebook.jpg';
import bgInstaFrame from '@/assets/bg-insta-frame.jpg';
import bgBrickVines from '@/assets/bg-brick-vines.jpg';
import bgEaselFlowers from '@/assets/bg-easel-flowers.jpg';
import bgEaselPink from '@/assets/bg-easel-pink.jpg';
import bgFloralFrame from '@/assets/bg-floral-frame.jpg';
import bgBlackFrame from '@/assets/bg-black-frame.jpg';
import bgWhiteBrick from '@/assets/bg-white-brick.jpg';
import bgCherryWood from '@/assets/bg-cherry-wood.jpg';
import bgPenRose from '@/assets/bg-pen-rose.jpg';
import bgLaceFlower from '@/assets/bg-lace-flower.jpg';
import bgTornRoses from '@/assets/bg-torn-roses.jpg';
import bgPeachBlossom from '@/assets/bg-peach-blossom.jpg';
import bgOrchidWhite from '@/assets/bg-orchid-white.jpg';
import bgFountainPen from '@/assets/bg-fountain-pen.jpg';
import bgSpiralBlank from '@/assets/bg-spiral-blank.jpg';
import bgSpiralHydrangea from '@/assets/bg-spiral-hydrangea.jpg';
import bgTreePencil from '@/assets/bg-tree-pencil.jpg';
import bgMinimalDesk from '@/assets/bg-minimal-desk.jpg';
import bgSceneCreator from '@/assets/bg-scene-creator.jpg';
import bgStationery from '@/assets/bg-stationery.jpg';
import bgClipboardPalm from '@/assets/bg-clipboard-palm.jpg';

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
  { id: 'bouquet-ribbon', label: 'Bouquet', src: bgBouquetRibbon },
  { id: 'craft-clip', label: 'Craft', src: bgCraftClip },
  { id: 'torn-edge', label: 'Torn', src: bgTornEdge },
  { id: 'ripped-white', label: 'Ripped', src: bgRippedWhite },
  { id: 'binder-clip', label: 'Binder', src: bgBinderClip },
  { id: 'pinned-paper', label: 'Pinned', src: bgPinnedPaper },
  { id: 'taped-torn', label: 'Taped', src: bgTapedTorn },
  { id: 'desk-notebook', label: 'Desk', src: bgDeskNotebook },
  { id: 'blossom-pen', label: 'Blossom Pen', src: bgBlossomPen },
  { id: 'torn-cork', label: 'Cork Board', src: bgTornCork },
  { id: 'heart-tape', label: 'Heart Tape', src: bgHeartTape },
  { id: 'cozy-knit', label: 'Cozy Knit', src: bgCozyKnit },
  { id: 'silk-coffee', label: 'Silk Coffee', src: bgSilkCoffee },
  { id: 'peach-notebook', label: 'Peach', src: bgPeachNotebook },
  { id: 'insta-frame', label: 'Insta', src: bgInstaFrame },
  { id: 'brick-vines', label: 'Brick Vines', src: bgBrickVines },
  { id: 'easel-flowers', label: 'Easel', src: bgEaselFlowers },
  { id: 'easel-pink', label: 'Easel Pink', src: bgEaselPink },
  { id: 'floral-frame', label: 'Floral Frame', src: bgFloralFrame },
  { id: 'black-frame', label: 'Black Frame', src: bgBlackFrame },
  { id: 'white-brick', label: 'White Brick', src: bgWhiteBrick },
  { id: 'cherry-wood', label: 'Cherry Wood', src: bgCherryWood },
  { id: 'pen-rose', label: 'Pen Rose', src: bgPenRose },
  { id: 'lace-flower', label: 'Lace', src: bgLaceFlower },
  { id: 'torn-roses', label: 'Torn Roses', src: bgTornRoses },
  { id: 'peach-blossom', label: 'Peach Bloom', src: bgPeachBlossom },
  { id: 'orchid-white', label: 'Orchid', src: bgOrchidWhite },
  { id: 'fountain-pen', label: 'Fountain Pen', src: bgFountainPen },
  { id: 'spiral-blank', label: 'Spiral', src: bgSpiralBlank },
  { id: 'spiral-hydrangea', label: 'Hydrangea', src: bgSpiralHydrangea },
  { id: 'tree-pencil', label: 'Tree Pencil', src: bgTreePencil },
  { id: 'minimal-desk', label: 'Minimal', src: bgMinimalDesk },
  { id: 'scene-creator', label: 'Scene', src: bgSceneCreator },
  { id: 'stationery', label: 'Stationery', src: bgStationery },
  { id: 'clipboard-palm', label: 'Clipboard', src: bgClipboardPalm },
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
