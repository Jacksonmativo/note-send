import { motion } from 'framer-motion';
import SlideEditor from '@/components/SlideEditor';
import { Sparkles } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center py-6 px-4"
      >
        <h1 className="text-3xl md:text-4xl font-handwriting text-foreground flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          Old School Notes
          <Sparkles className="w-6 h-6 text-primary" />
        </h1>
        <p className="text-sm font-handwriting-patrick text-muted-foreground mt-1">
          Write it. Stick it. Send it. ✂️📌
        </p>
      </motion.header>

      {/* Main */}
      <main className="flex-1 flex items-start justify-center pb-8">
        <SlideEditor />
      </main>

      {/* Footer */}
      <footer className="text-center py-3 text-xs text-muted-foreground font-handwriting-patrick">
        <p>Buy me coffee ☕ M-Pesa: 0702188406 — Jackson Mativo</p>
      </footer>
    </div>
  );
};

export default Index;
