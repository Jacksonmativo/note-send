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

// ── Notebook ink palette ──
const INK      = '#2c4a8f';   // classic ballpoint blue
const PENCIL   = '#6b675c';   // graphite grey
const MARGIN   = '#e07a7a';   // red margin rule
const RULE     = '#b8cfe4';   // faint blue ruled lines
const PAPER    = '#fbf7ec';   // aged exercise-book paper

const TITLE = 'NOTE SEND';

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
          SPLASH SCREEN — a page from your old exercise book
      ════════════════════════════════════════ */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            style={{
              position:       'fixed',
              inset:          0,
              zIndex:         9999,
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '22px',
              overflow:       'hidden',
              // paper + ruled lines, like a real exercise book
              background: `
                repeating-linear-gradient(
                  to bottom,
                  transparent 0px,
                  transparent 31px,
                  ${RULE} 31px,
                  ${RULE} 32px
                ),
                ${PAPER}
              `,
            }}
          >

            {/* ── Subtle paper grain ── */}
            <svg
              aria-hidden="true"
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                opacity: 0.05, pointerEvents: 'none', zIndex: 0,
              }}
            >
              <filter id="paper-grain">
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch" />
                <feColorMatrix type="saturate" values="0" />
              </filter>
              <rect width="100%" height="100%" filter="url(#paper-grain)" />
            </svg>

            {/* ── Red margin line ── */}
            <div
              style={{
                position: 'absolute', top: 0, bottom: 0,
                left: 'clamp(40px, 9vw, 88px)',
                width: 2, background: MARGIN, opacity: 0.55,
                pointerEvents: 'none', zIndex: 1,
              }}
            />

            {/* ── Punched binder holes ── */}
            {['18%', '50%', '82%'].map((top, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute', top,
                  left: 'clamp(10px, 2.5vw, 26px)',
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#efe9db',
                  boxShadow: 'inset 0 1.5px 3px rgba(0,0,0,0.22), inset 0 -1px 1px rgba(255,255,255,0.7)',
                  pointerEvents: 'none', zIndex: 1,
                }}
              />
            ))}

            {/* ── Coffee ring stain, top-right ── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.16 }}
              transition={{ delay: 1.6, duration: 1.2 }}
              style={{
                position: 'absolute',
                top: '9%', right: '10%',
                width: 110, height: 110,
                borderRadius: '50%',
                border: '9px solid #8a5a2b',
                filter: 'blur(0.6px)',
                transform: 'rotate(-8deg) scaleX(1.05)',
                pointerEvents: 'none', zIndex: 1,
              }}
            />

            {/* ── Hand-drawn doodles that sketch themselves in ── */}
            <svg
              aria-hidden="true"
              viewBox="0 0 100 100"
              style={{ position: 'absolute', top: '14%', left: '14%', width: 54, height: 54, zIndex: 1, pointerEvents: 'none' }}
            >
              {/* five-point star doodle */}
              <motion.path
                d="M50 8 L61 38 L93 38 L67 57 L77 88 L50 69 L23 88 L33 57 L7 38 L39 38 Z"
                fill="none" stroke={INK} strokeWidth="3.5"
                strokeLinecap="round" strokeLinejoin="round" opacity="0.65"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.9, duration: 1.1, ease: 'easeInOut' }}
              />
            </svg>

            <svg
              aria-hidden="true"
              viewBox="0 0 100 100"
              style={{ position: 'absolute', bottom: '16%', right: '13%', width: 50, height: 50, zIndex: 1, pointerEvents: 'none' }}
            >
              {/* heart doodle */}
              <motion.path
                d="M50 84 C20 60 8 40 16 26 C24 12 44 14 50 30 C56 14 76 12 84 26 C92 40 80 60 50 84 Z"
                fill="none" stroke={MARGIN} strokeWidth="3.5"
                strokeLinecap="round" strokeLinejoin="round" opacity="0.7"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 1.4, duration: 1, ease: 'easeInOut' }}
              />
            </svg>

            <svg
              aria-hidden="true"
              viewBox="0 0 120 60"
              style={{ position: 'absolute', bottom: '22%', left: '12%', width: 72, height: 36, zIndex: 1, pointerEvents: 'none' }}
            >
              {/* pencil spiral doodle */}
              <motion.path
                d="M8 40 C20 10 44 10 44 30 C44 46 24 48 26 32 C28 20 48 14 66 20 C86 27 96 22 112 12"
                fill="none" stroke={PENCIL} strokeWidth="3"
                strokeLinecap="round" opacity="0.55"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 1.9, duration: 1.1, ease: 'easeInOut' }}
              />
            </svg>

            {/* ── Paper plane gliding across the page ── */}
            <motion.svg
              aria-hidden="true"
              viewBox="0 0 48 48"
              initial={{ x: '-12vw', y: 0, opacity: 0, rotate: 8 }}
              animate={{
                x: ['-12vw', '30vw', '70vw', '112vw'],
                y: [0, -26, 14, -18],
                opacity: [0, 1, 1, 0],
                rotate: [8, -4, 6, -2],
              }}
              transition={{ delay: 1.2, duration: 7, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }}
              style={{ position: 'absolute', top: '26%', left: 0, width: 42, height: 42, zIndex: 1, pointerEvents: 'none' }}
            >
              <path
                d="M4 24 L44 6 L30 42 L22 28 Z M22 28 L44 6"
                fill="none" stroke={INK} strokeWidth="2.5"
                strokeLinejoin="round" strokeLinecap="round" opacity="0.7"
              />
              {/* dashed flight trail */}
              <path d="M-14 30 C-6 26 -2 28 2 25" stroke={PENCIL} strokeWidth="2" strokeDasharray="4 5" fill="none" opacity="0.5" />
            </motion.svg>

            {/* ── Logo, taped to the page like a photo ── */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0, rotate: -6 }}
              animate={{ scale: 1, opacity: 1, rotate: -2 }}
              transition={{ duration: 0.9, ease: [0.34, 1.56, 0.64, 1] }}
              style={{
                position: 'relative', zIndex: 2,
                background: '#fffdf6',
                padding: '14px 14px 12px',
                borderRadius: 4,
                boxShadow: '0 3px 14px rgba(60,50,20,0.18), 0 1px 3px rgba(60,50,20,0.12)',
              }}
            >
              {/* washi-tape strips */}
              <div style={{
                position: 'absolute', top: -10, left: -16,
                width: 62, height: 20, transform: 'rotate(-38deg)',
                background: 'rgba(240, 214, 140, 0.75)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.10)',
              }} />
              <div style={{
                position: 'absolute', top: -10, right: -16,
                width: 62, height: 20, transform: 'rotate(38deg)',
                background: 'rgba(240, 214, 140, 0.75)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.10)',
              }} />
              <img
                src="/favicon-48x48.png"
                alt="Old School Notes"
                style={{ width: 96, height: 'auto', display: 'block' }}
              />
            </motion.div>

            {/* ── App name — written letter by letter ── */}
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
              <h1
                aria-label={TITLE}
                style={{
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: 'clamp(2rem, 6vw, 2.6rem)',
                  fontWeight: 700,
                  color: INK,
                  letterSpacing: '0.06em',
                  margin: 0,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                {TITLE.split('').map((ch, i) => (
                  <motion.span
                    key={i}
                    aria-hidden="true"
                    initial={{ opacity: 0, y: 8, rotate: -6 }}
                    animate={{ opacity: 1, y: 0, rotate: 0 }}
                    transition={{ delay: 0.55 + i * 0.09, duration: 0.28, ease: 'easeOut' }}
                    style={{ display: 'inline-block', whiteSpace: 'pre' }}
                  >
                    {ch}
                  </motion.span>
                ))}
              </h1>

              {/* squiggly ink underline drawing itself */}
              <svg viewBox="0 0 220 14" style={{ width: 200, height: 13, display: 'block', margin: '2px auto 0' }}>
                <motion.path
                  d="M4 8 C 30 2, 55 12, 82 7 S 135 2, 162 8 S 205 11, 216 6"
                  fill="none" stroke={MARGIN} strokeWidth="3" strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.55 + TITLE.length * 0.09, duration: 0.6, ease: 'easeInOut' }}
                />
              </svg>
            </div>

            {/* ── Description — pencil handwriting ── */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.7, duration: 0.6, ease: 'easeOut' }}
              style={{
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '1.12rem',
                color: PENCIL,
                textAlign: 'center',
                maxWidth: 340,
                lineHeight: '32px',   // matches the ruled lines
                margin: 0,
                padding: '0 16px',
                position: 'relative',
                zIndex: 2,
              }}
            >
              Craft handwritten-style messages on a notebook canvas&nbsp;·&nbsp;
              sign documents digitally&nbsp;·&nbsp;keep a nostalgic journal that
              feels just like your old exercise book. Add stickers, images &amp;
              emojis, then export as HD images or A4&nbsp;PDFs.
            </motion.p>

            {/* ── Get Started — a hand-drawn ink button ── */}
            <motion.button
              initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
              animate={{ opacity: 1, scale: 1, rotate: -1 }}
              transition={{ delay: 2.1, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
              whileHover={{ scale: 1.05, rotate: 1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowSplash(false)}
              style={{
                marginTop: 6,
                padding: '11px 42px',
                // wobbly, hand-drawn-looking outline
                borderRadius: '255px 18px 225px 18px / 18px 225px 18px 255px',
                border: `2.5px solid ${INK}`,
                background: '#fffdf6',
                color: INK,
                fontSize: '1.15rem',
                fontFamily: "'Patrick Hand', cursive",
                fontWeight: 700,
                letterSpacing: '0.05em',
                cursor: 'pointer',
                boxShadow: `3px 3px 0 ${RULE}`,
                position: 'relative',
                zIndex: 2,
              }}
            >
              Get Started ✏️
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
