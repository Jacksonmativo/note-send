import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import SlideEditor from '@/components/SlideEditor';
import { Sparkles, Copy, Check, FileSignature } from 'lucide-react';

const Index = () => {
  const [copied, setCopied] = useState(false);

  const copyNumber = () => {
    navigator.clipboard.writeText('0702188406');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
        <Link
          to="/sign"
          className="inline-flex items-center gap-2 mt-2 px-4 py-1.5 rounded-lg bg-accent text-accent-foreground font-handwriting-patrick text-sm hover:opacity-90 transition-opacity"
        >
          <FileSignature className="w-4 h-4" />
          Sign a Document
        </Link>
      </motion.header>

      {/* Main */}
      <main className="flex-1 flex items-start justify-center pb-8">
        <SlideEditor />
      </main>

      {/* Footer */}
      <footer className="text-center py-3 text-xs text-muted-foreground font-handwriting-patrick">
        <p>
          Buy me coffee ☕ M-Pesa:{' '}
          <button
            onClick={copyNumber}
            className="inline-flex items-center gap-1 font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
            title="Click to copy"
          >
            0702188406
            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
          </button>
          {' '}— Jackson Mativo
        </p>
      </footer>
    </div>
  );
};

export default Index;
