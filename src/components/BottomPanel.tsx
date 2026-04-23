import { motion } from 'framer-motion';
import AudioTrimmer from './AudioTrimmer';

interface BottomPanelProps {
  totalDuration: number;
  onAudioChange: (audio: any) => void;
}

export default function BottomPanel({ totalDuration, onAudioChange }: BottomPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="bg-card border-t border-border px-4 py-4"
    >
      <div className="max-w-5xl mx-auto">
        <button className="w-full mb-4 px-4 py-3 bg-accent text-accent-foreground font-medium rounded-lg hover:bg-accent/90 transition-colors">
          Add Audio
        </button>
        <AudioTrimmer
          totalDuration={totalDuration}
          onAudioChange={onAudioChange}
        />
      </div>
    </motion.div>
  );
}