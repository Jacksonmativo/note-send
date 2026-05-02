import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import SlideEditor from '@/components/SlideEditor';
import { FileSignature, Coffee, TextCursorInput } from 'lucide-react';

// Load Patrick Hand from Google Fonts
if (!document.querySelector('link[data-font="patrick-hand"]')) {
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Patrick+Hand&display=swap';
  l.dataset.font = 'patrick-hand';
  document.head.appendChild(l);
}

// ── App metadata ──
document.title = 'Old School Notes';
const setMeta = (name: string, content: string, prop = false) => {
  const attr = prop ? 'property' : 'name';
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
  el.content = content;
};
const META_DESC = 'Old School Notes — craft personalised handwritten-style messages on a notebook canvas, sign documents digitally, and keep a nostalgic journal that looks just like your old exercise book. Add stickers, emojis & images, then export as HD images or A4 PDFs.';
setMeta('description',          META_DESC);
setMeta('og:title',             'Old School Notes', true);
setMeta('og:description',       META_DESC, true);
setMeta('og:type',              'website', true);
setMeta('twitter:card',         'summary');
setMeta('twitter:title',        'Old School Notes');
setMeta('twitter:description',  META_DESC);

const Index = () => {
  const [copied, setCopied]         = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  const copyNumber = () => {
    navigator.clipboard.writeText('0702188406');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ════════════════════════════════════════
          SPLASH SCREEN
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: 'easeInOut' }}
            style={{
              position:       'fixed',
              inset:          0,
              zIndex:         9999,
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '28px',
              background:     'rgb(8, 14, 44)',
              overflow:       'hidden',
            }}
          >

            {/* ── Grain / noise texture ── */}
            <svg
              aria-hidden="true"
              style={{
                position:     'absolute',
                inset:        0,
                width:        '100%',
                height:       '100%',
                opacity:      0.048,
                pointerEvents:'none',
                zIndex:       0,
              }}
            >
              <filter id="grain">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.72"
                  numOctaves="4"
                  stitchTiles="stitch"
                />
                <feColorMatrix type="saturate" values="0" />
              </filter>
              <rect width="100%" height="100%" filter="url(#grain)" />
            </svg>

            {/* ── Drifting orb 1 — indigo, top-left ── */}
            <motion.div
              animate={{ x: [0, 90, -50, 0], y: [0, -70, 60, 0] }}
              transition={{
                duration:   18,
                repeat:     Infinity,
                repeatType: 'mirror',
                ease:       'easeInOut',
              }}
              style={{
                position:     'absolute',
                width:        560,
                height:       560,
                borderRadius: '50%',
                background:   'radial-gradient(circle, rgba(79,101,255,0.30) 0%, transparent 68%)',
                top:          '-14%',
                left:         '-10%',
                pointerEvents:'none',
                filter:       'blur(2px)',
                zIndex:       0,
              }}
            />

            {/* ── Drifting orb 2 — royal blue, bottom-right ── */}
            <motion.div
              animate={{ x: [0, -80, 55, 0], y: [0, 80, -45, 0] }}
              transition={{
                duration:   23,
                repeat:     Infinity,
                repeatType: 'mirror',
                ease:       'easeInOut',
                delay:      2,
              }}
              style={{
                position:     'absolute',
                width:        500,
                height:       500,
                borderRadius: '50%',
                background:   'radial-gradient(circle, rgba(30,80,230,0.35) 0%, transparent 65%)',
                bottom:       '-14%',
                right:        '-8%',
                pointerEvents:'none',
                filter:       'blur(2px)',
                zIndex:       0,
              }}
            />

            {/* ── Drifting orb 3 — cyan accent, mid-right ── */}
            <motion.div
              animate={{ x: [0, 55, -65, 0], y: [0, -55, 35, 0] }}
              transition={{
                duration:   27,
                repeat:     Infinity,
                repeatType: 'mirror',
                ease:       'easeInOut',
                delay:      5,
              }}
              style={{
                position:     'absolute',
                width:        380,
                height:       380,
                borderRadius: '50%',
                background:   'radial-gradient(circle, rgba(56,182,255,0.20) 0%, transparent 65%)',
                top:          '32%',
                right:        '8%',
                pointerEvents:'none',
                filter:       'blur(3px)',
                zIndex:       0,
              }}
            />

            {/* ── Twinkling stars ── */}
            {[
              { top: '7%',  left: '13%', size: 2.5, delay: 0.0  },
              { top: '14%', left: '77%', size: 2.0, delay: 0.8  },
              { top: '27%', left: '4%',  size: 1.5, delay: 1.6  },
              { top: '59%', left: '87%', size: 2.0, delay: 0.4  },
              { top: '71%', left: '21%', size: 1.5, delay: 2.1  },
              { top: '81%', left: '64%', size: 2.5, delay: 1.2  },
              { top: '44%', left: '91%', size: 1.5, delay: 0.6  },
              { top: '89%', left: '9%',  size: 2.0, delay: 1.9  },
              { top: '19%', left: '49%', size: 1.5, delay: 3.0  },
              { top: '54%', left: '39%', size: 1.5, delay: 2.5  },
              { top: '37%', left: '69%', size: 2.0, delay: 1.4  },
              { top: '4%',  left: '41%', size: 1.5, delay: 0.2  },
              { top: '93%', left: '52%', size: 2.0, delay: 2.8  },
              { top: '66%', left: '55%', size: 1.5, delay: 0.9  },
            ].map((star, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.12, 1, 0.12], scale: [0.7, 1.4, 0.7] }}
                transition={{
                  duration:   2.6 + (i % 5) * 0.5,
                  repeat:     Infinity,
                  repeatType: 'loop',
                  ease:       'easeInOut',
                  delay:      star.delay,
                }}
                style={{
                  position:     'absolute',
                  top:          star.top,
                  left:         star.left,
                  width:        star.size,
                  height:       star.size,
                  borderRadius: '50%',
                  background:   '#c4d8ff',
                  boxShadow:    `0 0 ${star.size * 3}px ${star.size + 1}px rgba(160,200,255,0.75)`,
                  pointerEvents:'none',
                  zIndex:       1,
                }}
              />
            ))}

            {/* ── Central glow behind the logo ── */}
            <div
              style={{
                position:     'absolute',
                width:        400,
                height:       400,
                borderRadius: '50%',
                background:   'radial-gradient(circle, rgba(99,149,255,0.24) 0%, transparent 68%)',
                pointerEvents:'none',
                zIndex:       1,
              }}
            />

            {/* ── Favicon — grows in gently over 4 s ── */}
            <motion.img
              src="/favicon-48x48.png"
              alt="Old School Notes"
              initial={{ scale: 0.15, opacity: 0 }}
              animate={{ scale: 1,    opacity: 1 }}
              transition={{ duration: 4, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width:        120,
                height:       'auto',
                position:     'relative',
                zIndex:       2,
                filter:       'drop-shadow(0 8px 40px rgba(99,149,255,0.55))',
              }}
            />

            {/* ── App name ── */}
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0  }}
              transition={{ delay: 0.5, duration: 0.7, ease: 'easeOut' }}
              style={{
                fontFamily:    "'Patrick Hand', cursive",
                fontSize:      '1.9rem',
                fontWeight:    700,
                color:         '#e8eeff',
                letterSpacing: '0.01em',
                margin:        0,
                textAlign:     'center',
                position:      'relative',
                zIndex:        2,
              }}
            >
              NOTE SEND
            </motion.h1>

            {/* ── Description ── */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0  }}
              transition={{ delay: 0.75, duration: 0.65, ease: 'easeOut' }}
              style={{
                fontFamily:  "'Patrick Hand', cursive",
                fontSize:    '1.05rem',
                color:       'rgba(180,196,255,0.85)',
                textAlign:   'center',
                maxWidth:    320,
                lineHeight:  1.65,
                margin:      0,
                padding:     '0 16px',
                position:    'relative',
                zIndex:      2,
              }}
            >
              Craft handwritten-style messages on a notebook canvas&nbsp;·&nbsp;
              sign documents digitally&nbsp;·&nbsp;keep a nostalgic journal that
              feels just like your old exercise book. Add stickers, images &amp;
              emojis, then export as HD images or A4&nbsp;PDFs.
            </motion.p>

            {/* ── Get Started button ── */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0  }}
              transition={{ delay: 0.95, duration: 0.55, ease: 'easeOut' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{   scale: 0.97 }}
              onClick={() => setShowSplash(false)}
              style={{
                marginTop:     8,
                padding:       '12px 40px',
                borderRadius:  '999px',
                border:        '1.5px solid rgba(140,170,255,0.55)',
                background:    'linear-gradient(135deg, rgba(60,90,200,0.75) 0%, rgba(30,50,140,0.85) 100%)',
                color:         '#dde8ff',
                fontSize:      '0.95rem',
                fontFamily:    "'Georgia', serif",
                fontWeight:    600,
                letterSpacing: '0.04em',
                cursor:        'pointer',
                boxShadow:     '0 4px 28px rgba(60,100,255,0.30)',
                backdropFilter:'blur(4px)',
                position:      'relative',
                zIndex:        2,
              }}
            >
              Get Started
            </motion.button>

          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════
          HEADER
      ════════════════════════════════════════ */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-card border-b border-border px-4 py-3"
      >
        <div className="max-w-10xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/favicon-48x48.png" alt="Old School Notes" className="h-10 w-auto" />
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

      {/* ════════════════════════════════════════
          MAIN
      ════════════════════════════════════════ */}
      <main className="flex-1">
        <SlideEditor />
      </main>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
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