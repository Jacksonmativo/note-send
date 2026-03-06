import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import PdfSigner from '@/components/PdfSigner';

const PdfSign = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center py-6 px-4"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm font-handwriting-patrick text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Notes
        </Link>
        <h1 className="text-3xl md:text-4xl font-handwriting text-foreground flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          Sign Document
          <Sparkles className="w-6 h-6 text-primary" />
        </h1>
        <p className="text-sm font-handwriting-patrick text-muted-foreground mt-1">
          Upload a PDF, draw your signature, and save ✍️
        </p>
      </motion.header>

      <main className="flex-1 flex items-start justify-center pb-8">
        <PdfSigner />
      </main>
    </div>
  );
};

export default PdfSign;
