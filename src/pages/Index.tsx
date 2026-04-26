import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import SlideEditor from '@/components/SlideEditor';
import { Sparkles, FileSignature, Coffee, TextCursorInput } from 'lucide-react';

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
        className="bg-card border-b border-border px-4 py-3"
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/favicon-48x48.png" alt="Old School Notes" className="h-20 w-auto" />
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/journal"
              className="px-4 py-2 bg-secondary text-secondary-foreground font-medium rounded-lg hover:bg-secondary/90 transition-colors flex items-center gap-2"
            >
              <TextCursorInput className="w-4 h-4" />
              Journal
            </Link>
            <Link
              to="/sign"
              className="px-4 py-2 bg-accent text-accent-foreground font-medium rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
            >
              <FileSignature className="w-4 h-4" />
              Sign a Doc
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Main */}
      <main className="flex-1">
        <SlideEditor />
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <span className="font-sans">Buy me coffee ☕</span>
          <button
            onClick={copyNumber}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted transition-colors"
            title="Click to copy"
          >
            <Coffee className="w-3 h-3" />
            0702188406
            {copied && <span className="text-green-600">✓</span>}
          </button>
          <span className="font-sans">— Jackson Mativo</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
