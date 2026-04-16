'use client';

import { motion } from 'framer-motion';
import { CanvasObject } from '@/types/canvas';

interface Props {
  object: CanvasObject;
}

function getSpineColor(hex: string) {
  try {
    let color = hex;
    if (color.length === 4) {
      color = `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
    }
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`;
  } catch {
    return 'rgba(0,0,0,0.2)';
  }
}

function getPinlineColor(hex: string) {
  try {
    let color = hex;
    if (color.length === 4) {
      color = `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
    }
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${Math.round(r + (255 - r) * 0.45)}, ${Math.round(g + (255 - g) * 0.45)}, ${Math.round(b + (255 - b) * 0.45)}, 0.45)`;
  } catch {
    return 'rgba(255,255,255,0.3)';
  }
}

export default function Book({ object }: Props) {
  const coverColor = object.style.backgroundColor || '#4f46e5';
  const spineColor = getSpineColor(coverColor);
  const pinlineColor = getPinlineColor(coverColor);
  const coverImage = object.style.coverImage;
  const fontClass = object.style.fontFamily === 'serif'
    ? 'font-serif'
    : object.style.fontFamily === 'mono'
    ? 'font-mono'
    : 'font-sans';
  const isSerif = object.style.fontFamily === 'serif';
  const sectionCount = object.metadata?.sections?.length || 1;
  const title = object.content || 'Untitled Collection';

  // Responsive font size: fits width, capped
  const titleSize = Math.max(14, Math.min(object.width / 9, 24));

  return (
    <motion.div
      layoutId={`book-${object.id}`}
      className="w-full h-full relative group cursor-pointer"
      style={{ perspective: 1200 }}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
    >
      {/* ── Base Shadow (Anchors the book to the canvas) ── */}
      <motion.div
        className="absolute inset-0 bg-black/40"
        style={{
          borderRadius: '4px 12px 12px 4px',
          filter: 'blur(8px)',
        }}
        variants={{
          rest: { x: 4, y: 6, opacity: 0.6, scale: 0.98 },
          hover: { x: 8, y: 12, opacity: 0.4, scale: 0.96 },
          tap: { x: 2, y: 4, opacity: 0.8, scale: 0.99 },
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      />

      {/* ── Back Cover & Pages (The block of the book that stays relatively still) ── */}
      <motion.div
        className="absolute inset-0"
        style={{
          borderRadius: '4px 12px 12px 4px',
          background: '#f4f1ea', // Warm paper color
          border: '1px solid rgba(0,0,0,0.1)',
          // Draw horizontal lines to simulate stacked pages on the right edge
          backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 3px)',
          transformOrigin: 'left center',
        }}
        variants={{
          rest: { x: 0, y: 0, rotateY: 0, z: 0 },
          // The page block shifts slightly to the right to simulate the book opening
          hover: { x: 4, y: 0, rotateY: 0, z: -10 },
          tap: { x: 0, y: 0, rotateY: 0, z: 0 },
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      />

      {/* ── Front Cover (Hinges open from the spine) ── */}
      <motion.div
        className="absolute inset-0 z-10 overflow-hidden flex flex-row"
        style={{
          backgroundColor: coverColor,
          backgroundImage: coverImage ? `url(${coverImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '4px 12px 12px 4px',
          boxShadow: `
            inset 0 1px 0 rgba(255,255,255,0.2),
            inset -1px 0 0 rgba(0,0,0,0.1)
          `,
          transformOrigin: 'left center', // Hinge on the left spine!
        }}
        variants={{
          rest: { rotateY: 0, x: 0, y: 0, z: 2 },
          // The cover tilts open towards the user (negative rotateY), revealing the pages underneath
          hover: { rotateY: -12, x: -2, y: -2, z: 10 },
          tap: { rotateY: 0, x: 0, y: 0, z: 0 }
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Dynamic shadow on the inside of the cover when it opens */}
        <motion.div 
          className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/20 to-transparent pointer-events-none z-30"
          variants={{
            rest: { opacity: 0 },
            hover: { opacity: 1 },
            tap: { opacity: 0 }
          }}
        />

        {/* ── Spine Area ── */}
        <div
          className="flex-shrink-0 relative z-20 overflow-hidden"
          style={{
            width: '32px',
            backgroundColor: spineColor,
            borderRight: '1px solid rgba(0,0,0,0.2)',
          }}
        >
          {/* Subtle cloth texture on spine */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 3px)',
          }} />
          
          {/* Hinge Indent (Shadow & Highlight) */}
          <div className="absolute right-0 top-0 bottom-0 w-[6px] bg-gradient-to-r from-transparent to-black/30" />
          <div className="absolute right-[-6px] top-0 bottom-0 w-[6px] bg-gradient-to-r from-white/10 to-transparent" />
        </div>

        {/* ── Cover Body Area ── */}
        <div className="flex-1 relative z-10 flex flex-col justify-between">
          
          {/* Delicate Vignette/Burn over the whole cover */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/10 via-transparent to-black/20" />

          {/* Book Cloth Texture Overlay */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            opacity: 0.08,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            mixBlendMode: 'multiply',
          }} />

          {/* Golden/Pinline Frame */}
          <div style={{
            position: 'absolute',
            top: 12, left: 10, right: 12, bottom: 12,
            border: `1.5px solid ${pinlineColor}`,
            borderRadius: 4,
            pointerEvents: 'none',
          }} />

          {/* Gold Ribbon Bookmark */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 24,
            width: 14,
            height: 64,
            background: 'linear-gradient(160deg, #FCD34D 0%, #EAB308 40%, #CA8A04 100%)',
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 10px), 0 100%)',
            boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.4)',
            zIndex: 20,
          }}>
            {/* Ribbon drop shadow rendered via pseudo-element illusion */}
            <div className="absolute -bottom-2 -left-1 -right-1 h-4 bg-black/20 blur-[2px] -z-10" />
          </div>

          {/* Top Ornament */}
          <div className="relative z-10 px-6 pt-10">
            <div className="flex items-center justify-center gap-4 opacity-70">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/60" />
              <div className="w-2 h-2 rotate-45 border border-white/60" />
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/60" />
            </div>
          </div>

          {/* Title block */}
          <div className="relative z-10 px-8 pb-14 text-center">
            <h3
              className={`text-white leading-snug line-clamp-4`}
              style={{
                fontFamily: isSerif ? "'Lora', 'Georgia', serif" : "'Inter', sans-serif",
                fontSize: titleSize,
                fontWeight: isSerif ? 700 : 600,
                letterSpacing: isSerif ? '0' : '-0.02em',
                textShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}
            >
              {title}
            </h3>
            <div className="mt-4 w-12 h-[2px] mx-auto bg-white/40 rounded-full" />
          </div>

          {/* Status Bar / Bottom Info */}
          <div className="relative z-10 bg-black/15 border-t border-white/10 px-4 py-2.5 flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-[0.15em] font-bold text-white/70">
              {sectionCount} {sectionCount === 1 ? 'Section' : 'Sections'}
            </span>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full border border-white/40 bg-white/10" />
              <div className="w-1.5 h-1.5 rounded-full border border-white/40 bg-white/10" />
              <div className="w-1.5 h-1.5 rounded-full border border-white/40 bg-white/10" />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

