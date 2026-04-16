'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  Layers,
  ArrowRight,
  Zap,
  BookOpen,
  Link2,
  Brain,
  Sparkles,
  GitBranch,
  ScanText,
  Boxes,
} from 'lucide-react';

// ─── Design tokens ───────────────────────────────────────────────────────────
const C = {
  dark: '#0c0c0c',
  cream: '#f7f3ec',
  accent: '#5b50f0',
  gold: '#f5c842',
  muted: '#6b6b6b',
  border: 'rgba(255,255,255,0.08)',
  textDark: '#111111',
  textCream: '#f7f3ec',
};

const PLAYFAIR = "'Playfair Display', serif";
const SYNE = "'Syne', sans-serif";
const CAVEAT = "'Caveat', cursive";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function FadeIn({
  children,
  delay = 0,
  y = 24,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Nav ─────────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: '0 2rem',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: scrolled ? 'rgba(12,12,12,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? `1px solid ${C.border}` : 'none',
        transition: 'background 0.3s, backdrop-filter 0.3s, border-color 0.3s',
        fontFamily: SYNE,
      }}
    >
      {/* Wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: C.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Layers size={18} color="#fff" />
        </div>
        <span
          style={{
            fontFamily: SYNE,
            fontWeight: 700,
            fontSize: '1.1rem',
            color: C.textCream,
            letterSpacing: '-0.02em',
          }}
        >
          MindCanvas
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link
          href="/login"
          style={{
            color: 'rgba(247,243,236,0.7)',
            fontSize: '0.875rem',
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) =>
            ((e.target as HTMLAnchorElement).style.color = C.textCream)
          }
          onMouseLeave={(e) =>
            ((e.target as HTMLAnchorElement).style.color =
              'rgba(247,243,236,0.7)')
          }
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          style={{
            background: C.gold,
            color: C.dark,
            padding: '8px 18px',
            borderRadius: 8,
            fontSize: '0.875rem',
            fontWeight: 700,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.transform =
              'translateY(-1px)';
            (e.currentTarget as HTMLAnchorElement).style.boxShadow =
              `0 4px 20px rgba(245,200,66,0.4)`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.transform =
              'translateY(0)';
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
          }}
        >
          Start free <ArrowRight size={14} />
        </Link>
      </div>
    </nav>
  );
}

// ─── Floating canvas objects (hero decorations) ───────────────────────────────
function FloatingStickyNote({
  color,
  text,
  rotate,
  top,
  left,
  delay,
}: {
  color: string;
  text: string;
  rotate: number;
  top: string;
  left: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, rotate: rotate - 4 }}
      animate={{ opacity: 1, scale: 1, rotate }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'absolute',
        top,
        left,
        width: 160,
        background: color,
        borderRadius: 4,
        padding: '14px 16px 20px',
        boxShadow: '4px 8px 24px rgba(0,0,0,0.35)',
        fontFamily: CAVEAT,
        fontSize: '0.95rem',
        color: '#222',
        lineHeight: 1.5,
        transform: `rotate(${rotate}deg)`,
        userSelect: 'none',
      }}
    >
      {text}
    </motion.div>
  );
}

function FloatingBookCard({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotate: 2 }}
      animate={{ opacity: 1, y: 0, rotate: 2 }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'absolute',
        top: '55%',
        left: '30%',
        width: 200,
        background: '#fff',
        borderRadius: 8,
        boxShadow: '4px 8px 28px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Spine */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 8,
          background: C.accent,
        }}
      />
      <div style={{ marginLeft: 8, padding: '14px 14px 16px' }}>
        <div
          style={{
            fontFamily: SYNE,
            fontWeight: 700,
            fontSize: '0.8rem',
            color: '#111',
            marginBottom: 8,
          }}
        >
          Research Notes
        </div>
        {['Introduction', 'Key Findings', 'Next Steps'].map((t) => (
          <div
            key={t}
            style={{
              fontSize: '0.7rem',
              color: '#666',
              fontFamily: SYNE,
              padding: '4px 0',
              borderBottom: '1px solid #eee',
            }}
          >
            {t}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function FloatingAIPanel({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'absolute',
        bottom: '12%',
        right: '2%',
        width: 210,
        background: 'rgba(20,20,30,0.92)',
        border: '1px solid rgba(91,80,240,0.4)',
        borderRadius: 12,
        padding: '14px',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 10,
        }}
      >
        <Sparkles size={12} color={C.gold} />
        <span
          style={{
            fontFamily: SYNE,
            fontSize: '0.7rem',
            color: C.gold,
            fontWeight: 600,
          }}
        >
          AI Brainstorm
        </span>
      </div>
      {[
        'Market differentiation',
        'User onboarding flow',
        'Revenue model',
        'Growth channels',
      ].map((item, i) => (
        <div
          key={i}
          style={{
            fontFamily: SYNE,
            fontSize: '0.68rem',
            color: 'rgba(247,243,236,0.75)',
            padding: '4px 0',
            borderBottom:
              i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 6,
          }}
        >
          <span style={{ color: C.accent, marginTop: 1 }}>→</span>
          {item}
        </div>
      ))}
    </motion.div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section
      style={{
        minHeight: '100vh',
        background: C.dark,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      {/* Grain overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.035,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px',
          pointerEvents: 'none',
        }}
      />

      {/* Radial glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          right: '30%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(91,80,240,0.12) 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '10%',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(circle, rgba(245,200,66,0.06) 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          alignItems: 'center',
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 2rem',
          paddingTop: '80px',
          gap: '4rem',
          width: '100%',
        }}
        className="hero-grid"
      >
        {/* Left: text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(91,80,240,0.15)',
              border: '1px solid rgba(91,80,240,0.3)',
              borderRadius: 100,
              padding: '5px 14px',
              marginBottom: '1.5rem',
            }}
          >
            <Sparkles size={12} color={C.accent} />
            <span
              style={{
                fontFamily: SYNE,
                fontSize: '0.75rem',
                fontWeight: 600,
                color: C.accent,
                letterSpacing: '0.05em',
              }}
            >
              AI-powered infinite canvas
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontFamily: PLAYFAIR,
              fontSize: 'clamp(3.2rem, 6vw, 5.5rem)',
              fontWeight: 900,
              lineHeight: 1.08,
              color: C.textCream,
              margin: 0,
              marginBottom: '1.5rem',
            }}
          >
            Where{' '}
            <em
              style={{
                fontStyle: 'italic',
                color: C.gold,
              }}
            >
              ideas
            </em>
            <br />
            find their form.
          </motion.h1>

          {/* Body */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            style={{
              fontFamily: SYNE,
              fontSize: '1.05rem',
              color: 'rgba(247,243,236,0.65)',
              lineHeight: 1.7,
              maxWidth: 440,
              margin: 0,
              marginBottom: '2.5rem',
            }}
          >
            MindCanvas is the infinite canvas that thinks with you. Capture
            anything, connect everything, and let AI help you see what matters.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}
          >
            <Link
              href="/signup"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: C.gold,
                color: C.dark,
                padding: '14px 28px',
                borderRadius: 10,
                fontFamily: SYNE,
                fontWeight: 700,
                fontSize: '1rem',
                textDecoration: 'none',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow =
                  '0 8px 32px rgba(245,200,66,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Start for free
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              style={{
                fontFamily: SYNE,
                fontWeight: 500,
                fontSize: '0.9rem',
                color: 'rgba(247,243,236,0.55)',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = C.textCream)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = 'rgba(247,243,236,0.55)')
              }
            >
              Already have an account →
            </Link>
          </motion.div>
        </motion.div>

        {/* Right: floating canvas objects */}
        <div
          style={{
            position: 'relative',
            height: 480,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Connection line (SVG) */}
          <motion.svg
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            <path
              d="M 80 140 C 140 180, 170 260, 120 320"
              fill="none"
              stroke={C.accent}
              strokeWidth="1.5"
              strokeDasharray="5 4"
              opacity="0.5"
            />
            <circle cx="80" cy="140" r="4" fill={C.accent} opacity="0.7" />
            <circle cx="120" cy="320" r="4" fill={C.accent} opacity="0.7" />
          </motion.svg>

          <FloatingStickyNote
            color="#fef9c3"
            text="💡 The canvas that thinks with you"
            rotate={-4}
            top="8%"
            left="5%"
            delay={0.7}
          />
          <FloatingStickyNote
            color="#dbeafe"
            text="Brainstorm → cluster → summarize"
            rotate={5}
            top="5%"
            left="52%"
            delay={0.9}
          />
          <FloatingStickyNote
            color="#fce7f3"
            text="Q3 research goals\n✓ User interviews\n✓ Competitor map\n→ AI synthesis"
            rotate={-2}
            top="42%"
            left="2%"
            delay={1.1}
          />
          <FloatingBookCard delay={0.95} />
          <FloatingAIPanel delay={1.05} />
        </div>
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        style={{
          position: 'absolute',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span
          style={{
            fontFamily: SYNE,
            fontSize: '0.7rem',
            color: 'rgba(247,243,236,0.3)',
            letterSpacing: '0.1em',
          }}
        >
          SCROLL
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          style={{
            width: 1,
            height: 28,
            background:
              'linear-gradient(to bottom, rgba(247,243,236,0.3), transparent)',
          }}
        />
      </motion.div>
    </section>
  );
}

// ─── Marquee ──────────────────────────────────────────────────────────────────
const TAGS = [
  'Infinite Canvas',
  'AI Brainstorm',
  'Smart Books',
  'Sketch Mode',
  'Auto-Cluster',
  'OCR',
  'Roadmap Engine',
  'Connections',
  'Sticky Notes',
  'Rich Text',
  'Tables',
  'Shapes',
];

function Marquee() {
  const doubled = [...TAGS, ...TAGS];
  return (
    <div
      style={{
        background: C.dark,
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid rgba(247,243,236,0.06)`,
        overflow: 'hidden',
        padding: '1.1rem 0',
      }}
    >
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
      <div
        style={{
          display: 'flex',
          gap: '2.5rem',
          width: 'max-content',
          animation: 'marquee 28s linear infinite',
        }}
      >
        {doubled.map((tag, i) => (
          <span
            key={i}
            style={{
              fontFamily: SYNE,
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              color:
                i % 3 === 0
                  ? C.gold
                  : i % 3 === 1
                  ? 'rgba(247,243,236,0.5)'
                  : C.accent,
              whiteSpace: 'nowrap',
            }}
          >
            {tag}
            <span
              style={{
                marginLeft: '2.5rem',
                color: 'rgba(247,243,236,0.15)',
              }}
            >
              ·
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Boxes,
    title: 'Infinite Canvas',
    desc: 'Pan, zoom, and spread your thinking without limits. Your canvas grows with your ideas.',
    accent: C.accent,
    visual: (
      <div
        style={{
          position: 'relative',
          height: 120,
          background: '#f0eef9',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle, rgba(91,80,240,0.15) 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />
        {[
          { x: 30, y: 20, w: 60, h: 36, color: '#fef9c3', rot: -3 },
          { x: 110, y: 40, w: 72, h: 40, color: '#dbeafe', rot: 4 },
          { x: 60, y: 70, w: 55, h: 32, color: '#fce7f3', rot: 1 },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: s.x,
              top: s.y,
              width: s.w,
              height: s.h,
              background: s.color,
              borderRadius: 4,
              transform: `rotate(${s.rot}deg)`,
              boxShadow: '2px 4px 10px rgba(0,0,0,0.1)',
            }}
          />
        ))}
      </div>
    ),
  },
  {
    icon: Brain,
    title: 'AI Intelligence',
    desc: 'Brainstorm new directions, group related concepts, and summarize sprawling notes in one click.',
    accent: C.gold,
    visual: (
      <div
        style={{
          height: 120,
          background: '#111',
          borderRadius: 8,
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 4,
          }}
        >
          <Sparkles size={10} color={C.gold} />
          <span
            style={{
              fontFamily: SYNE,
              fontSize: '0.65rem',
              color: C.gold,
              fontWeight: 600,
            }}
          >
            AI Brainstorm
          </span>
        </div>
        {['Competitive positioning', 'Distribution channels', 'Core differentiator'].map(
          (t, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: SYNE,
                fontSize: '0.65rem',
                color: 'rgba(247,243,236,0.7)',
              }}
            >
              <span style={{ color: C.accent }}>→</span>
              {t}
            </div>
          )
        )}
      </div>
    ),
  },
  {
    icon: BookOpen,
    title: 'Smart Books',
    desc: 'Organize deep research in multi-section books with a rich text editor and AI-generated pages.',
    accent: '#34d399',
    visual: (
      <div
        style={{
          height: 120,
          background: '#fff',
          borderRadius: 8,
          overflow: 'hidden',
          display: 'flex',
          border: '1px solid #eee',
        }}
      >
        <div
          style={{ width: 8, background: C.accent, flexShrink: 0 }}
        />
        <div style={{ padding: '12px 12px', flex: 1 }}>
          <div
            style={{
              fontFamily: SYNE,
              fontWeight: 700,
              fontSize: '0.72rem',
              color: '#111',
              marginBottom: 8,
            }}
          >
            Product Research
          </div>
          {['Overview', 'User Interviews', 'Findings', 'Next Steps'].map((s) => (
            <div
              key={s}
              style={{
                fontFamily: SYNE,
                fontSize: '0.62rem',
                color: '#888',
                padding: '3px 0',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              {s}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: Link2,
    title: 'Visual Connections',
    desc: 'Draw lines between any two objects to map relationships, flows, and dependencies.',
    accent: '#f472b6',
    visual: (
      <div
        style={{
          height: 120,
          background: '#f7f3ec',
          borderRadius: 8,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <path
            d="M 55 35 C 100 55, 110 75, 155 90"
            fill="none"
            stroke={C.accent}
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <circle cx="55" cy="35" r="3.5" fill={C.accent} />
          <circle cx="155" cy="90" r="3.5" fill={C.accent} />
        </svg>
        <div
          style={{
            position: 'absolute',
            left: 16,
            top: 18,
            background: '#fef9c3',
            padding: '6px 10px',
            borderRadius: 4,
            fontSize: '0.62rem',
            fontFamily: CAVEAT,
            boxShadow: '2px 4px 8px rgba(0,0,0,0.1)',
          }}
        >
          Problem space
        </div>
        <div
          style={{
            position: 'absolute',
            right: 16,
            bottom: 14,
            background: '#fce7f3',
            padding: '6px 10px',
            borderRadius: 4,
            fontSize: '0.62rem',
            fontFamily: CAVEAT,
            boxShadow: '2px 4px 8px rgba(0,0,0,0.1)',
          }}
        >
          Solution space
        </div>
      </div>
    ),
  },
];

function Features() {
  return (
    <section
      style={{
        background: C.cream,
        padding: '7rem 2rem',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <FadeIn>
          <p
            style={{
              fontFamily: SYNE,
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: C.accent,
              marginBottom: '0.75rem',
            }}
          >
            CAPABILITIES
          </p>
          <h2
            style={{
              fontFamily: PLAYFAIR,
              fontSize: 'clamp(2.2rem, 4vw, 3.2rem)',
              fontWeight: 900,
              color: C.textDark,
              margin: 0,
              marginBottom: '4rem',
              lineHeight: 1.15,
            }}
          >
            Everything your
            <br />
            thinking needs.
          </h2>
        </FadeIn>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1.5rem',
          }}
          className="features-grid"
        >
          {FEATURES.map((f, i) => (
            <FadeIn key={f.title} delay={i * 0.1}>
              <div
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  padding: '1.75rem',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow =
                    '0 8px 32px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow =
                    '0 2px 16px rgba(0,0,0,0.04)';
                }}
              >
                {f.visual}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginTop: '1.25rem',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: `${f.accent}18`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <f.icon size={15} color={f.accent} />
                  </div>
                  <h3
                    style={{
                      fontFamily: SYNE,
                      fontWeight: 700,
                      fontSize: '1rem',
                      color: C.textDark,
                      margin: 0,
                    }}
                  >
                    {f.title}
                  </h3>
                </div>
                <p
                  style={{
                    fontFamily: SYNE,
                    fontSize: '0.875rem',
                    color: C.muted,
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {f.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── AI Spotlight ─────────────────────────────────────────────────────────────
const AI_ACTIONS = [
  {
    icon: Sparkles,
    name: 'Brainstorm',
    desc: 'Generate 5 related ideas from any concept or note instantly.',
    example: ['Market positioning', 'Pricing strategy', 'User personas', 'Growth loops'],
  },
  {
    icon: Boxes,
    name: 'Cluster',
    desc: 'Automatically group related objects by theme across your entire canvas.',
    example: ['Problems', 'Solutions', 'Opportunities', 'Risks'],
  },
  {
    icon: GitBranch,
    name: 'Roadmap',
    desc: 'Turn a todo list into a visual, branching project roadmap in seconds.',
    example: ['Phase 1: Research', 'Phase 2: Design', 'Phase 3: Build'],
  },
];

function AISpotlight() {
  return (
    <section
      style={{
        background: C.dark,
        padding: '7rem 2rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Accent glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 800,
          height: 400,
          borderRadius: '50%',
          background: `radial-gradient(ellipse, rgba(91,80,240,0.08) 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
        <FadeIn>
          <p
            style={{
              fontFamily: SYNE,
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: C.accent,
              marginBottom: '0.75rem',
            }}
          >
            INTELLIGENCE LAYER
          </p>
          <h2
            style={{
              fontFamily: PLAYFAIR,
              fontSize: 'clamp(2.2rem, 4vw, 3.2rem)',
              fontWeight: 900,
              color: C.textCream,
              margin: 0,
              marginBottom: '0.75rem',
              lineHeight: 1.15,
            }}
          >
            The canvas that
            <br />
            <em style={{ fontStyle: 'italic', color: C.gold }}>
              thinks with you.
            </em>
          </h2>
          <p
            style={{
              fontFamily: SYNE,
              fontSize: '1rem',
              color: 'rgba(247,243,236,0.55)',
              maxWidth: 480,
              lineHeight: 1.7,
              marginBottom: '3.5rem',
            }}
          >
            AI isn&apos;t bolted on — it&apos;s woven into every part of MindCanvas.
            The more you use it, the smarter your canvas becomes.
          </p>
        </FadeIn>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.25rem',
          }}
          className="ai-grid"
        >
          {AI_ACTIONS.map((a, i) => (
            <FadeIn key={a.name} delay={i * 0.12}>
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 16,
                  padding: '1.75rem',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `rgba(91,80,240,0.35)`;
                  e.currentTarget.style.background = 'rgba(91,80,240,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                  e.currentTarget.style.background =
                    'rgba(255,255,255,0.03)';
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: `rgba(91,80,240,0.2)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  <a.icon size={16} color={C.accent} />
                </div>
                <h3
                  style={{
                    fontFamily: SYNE,
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: C.textCream,
                    margin: 0,
                    marginBottom: '0.5rem',
                  }}
                >
                  {a.name}
                </h3>
                <p
                  style={{
                    fontFamily: SYNE,
                    fontSize: '0.825rem',
                    color: 'rgba(247,243,236,0.5)',
                    lineHeight: 1.6,
                    margin: 0,
                    marginBottom: '1.25rem',
                  }}
                >
                  {a.desc}
                </p>
                <div
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: 8,
                    padding: '10px 12px',
                  }}
                >
                  {a.example.map((ex, j) => (
                    <div
                      key={j}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontFamily: SYNE,
                        fontSize: '0.7rem',
                        color: 'rgba(247,243,236,0.6)',
                        padding: '3px 0',
                      }}
                    >
                      <span style={{ color: C.gold, fontSize: '0.6rem' }}>
                        ◆
                      </span>
                      {ex}
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Workflow ─────────────────────────────────────────────────────────────────
const STEPS = [
  {
    num: '01',
    icon: ScanText,
    title: 'Capture',
    desc: 'Dump everything onto the canvas — notes, sketches, images, ideas. No structure needed.',
  },
  {
    num: '02',
    icon: Link2,
    title: 'Connect',
    desc: 'Draw relationships, let AI cluster themes, and link your thinking into a coherent map.',
  },
  {
    num: '03',
    icon: Zap,
    title: 'Create',
    desc: 'Turn your canvas into books, roadmaps, and summaries. From chaos to clarity.',
  },
];

function Workflow() {
  return (
    <section
      style={{
        background: C.cream,
        padding: '7rem 2rem',
        borderTop: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <FadeIn>
          <p
            style={{
              fontFamily: SYNE,
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: C.accent,
              marginBottom: '0.75rem',
            }}
          >
            HOW IT WORKS
          </p>
          <h2
            style={{
              fontFamily: PLAYFAIR,
              fontSize: 'clamp(2.2rem, 4vw, 3.2rem)',
              fontWeight: 900,
              color: C.textDark,
              margin: 0,
              marginBottom: '4rem',
              lineHeight: 1.15,
            }}
          >
            Three steps
            <br />
            to clarity.
          </h2>
        </FadeIn>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '2rem',
            position: 'relative',
          }}
          className="steps-grid"
        >
          {/* Connecting line */}
          <div
            style={{
              position: 'absolute',
              top: 28,
              left: '18%',
              right: '18%',
              height: 1,
              background: `linear-gradient(to right, ${C.accent}40, ${C.accent}40)`,
            }}
          />

          {STEPS.map((s, i) => (
            <FadeIn key={s.num} delay={i * 0.15}>
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: '1.5rem',
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      background: C.dark,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: `0 4px 20px rgba(0,0,0,0.15)`,
                    }}
                  >
                    <s.icon size={22} color={C.gold} />
                  </div>
                  <span
                    style={{
                      fontFamily: PLAYFAIR,
                      fontSize: '1.1rem',
                      fontWeight: 900,
                      color: 'rgba(0,0,0,0.12)',
                    }}
                  >
                    {s.num}
                  </span>
                </div>
                <h3
                  style={{
                    fontFamily: SYNE,
                    fontWeight: 700,
                    fontSize: '1.15rem',
                    color: C.textDark,
                    margin: 0,
                    marginBottom: '0.5rem',
                  }}
                >
                  {s.title}
                </h3>
                <p
                  style={{
                    fontFamily: SYNE,
                    fontSize: '0.875rem',
                    color: C.muted,
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  {s.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Section ──────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section
      style={{
        background: C.accent,
        padding: '6rem 2rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative grain */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.04,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          pointerEvents: 'none',
        }}
      />
      {/* Gold arc */}
      <div
        style={{
          position: 'absolute',
          right: -100,
          top: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          border: `60px solid rgba(245,200,66,0.12)`,
          pointerEvents: 'none',
        }}
      />

      <FadeIn>
        <div
          style={{
            maxWidth: 700,
            margin: '0 auto',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <h2
            style={{
              fontFamily: PLAYFAIR,
              fontSize: 'clamp(2.4rem, 5vw, 4rem)',
              fontWeight: 900,
              color: '#fff',
              margin: 0,
              marginBottom: '1rem',
              lineHeight: 1.1,
            }}
          >
            Your ideas deserve
            <br />
            <em style={{ fontStyle: 'italic', color: C.gold }}>better.</em>
          </h2>
          <p
            style={{
              fontFamily: SYNE,
              fontSize: '1.05rem',
              color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.7,
              marginBottom: '2.5rem',
            }}
          >
            Join thinkers, researchers, and builders who work smarter
            on MindCanvas — free to start, forever.
          </p>
          <Link
            href="/signup"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: C.gold,
              color: C.dark,
              padding: '16px 36px',
              borderRadius: 12,
              fontFamily: SYNE,
              fontWeight: 800,
              fontSize: '1.05rem',
              textDecoration: 'none',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.04)';
              e.currentTarget.style.boxShadow =
                '0 10px 40px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Start using MindCanvas for free
            <ArrowRight size={18} />
          </Link>
          <p
            style={{
              fontFamily: SYNE,
              fontSize: '0.78rem',
              color: 'rgba(255,255,255,0.45)',
              marginTop: '1rem',
            }}
          >
            No credit card required · Works in your browser
          </p>
        </div>
      </FadeIn>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer
      style={{
        background: C.dark,
        padding: '2.5rem 2rem',
        borderTop: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: C.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Layers size={14} color="#fff" />
        </div>
        <span
          style={{
            fontFamily: SYNE,
            fontWeight: 700,
            fontSize: '0.9rem',
            color: 'rgba(247,243,236,0.6)',
          }}
        >
          MindCanvas
        </span>
      </div>
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        {[
          { label: 'Sign in', href: '/login' },
          { label: 'Sign up', href: '/signup' },
        ].map((l) => (
          <Link
            key={l.label}
            href={l.href}
            style={{
              fontFamily: SYNE,
              fontSize: '0.8rem',
              color: 'rgba(247,243,236,0.4)',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = 'rgba(247,243,236,0.8)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = 'rgba(247,243,236,0.4)')
            }
          >
            {l.label}
          </Link>
        ))}
      </div>
    </footer>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  useEffect(() => {
    document.body.classList.add('landing');
    return () => document.body.classList.remove('landing');
  }, []);

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-grid > div:last-child { display: none !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .ai-grid { grid-template-columns: 1fr !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={{ fontFamily: SYNE, background: C.dark }}>
        <Nav />
        <Hero />
        <Marquee />
        <Features />
        <AISpotlight />
        <Workflow />
        <CTASection />
        <Footer />
      </div>
    </>
  );
}
