'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, type Variants } from 'framer-motion';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import Link from 'next/link';

const DOT_GRID = Array.from({ length: 320 }, (_, i) => i);

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55 } },
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ fontFamily: "'Syne', sans-serif", background: '#0d0d0f' }}>

      {/* ── LEFT PANEL ─────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between relative overflow-hidden"
        style={{ width: '52%', background: '#0d0d0f', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Dot grid canvas */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: 0.18 }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(20, 1fr)',
              width: '100%',
              height: '100%',
              padding: '40px',
              gap: '0',
            }}
          >
            {DOT_GRID.map((i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: 2,
                    height: 2,
                    borderRadius: '50%',
                    background: '#ffffff',
                    opacity: ((i * 13) % 100) > 40 ? 0.6 : 0.15,
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Glow orb */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-60%, -55%)',
          }}
        />

        {/* Top wordmark */}
        <div className="relative z-10 px-12 pt-12">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center gap-2.5"
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              }}
            />
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: '0.12em',
                color: 'rgba(255,255,255,0.9)',
                textTransform: 'uppercase',
              }}
            >
              MindCanvas
            </span>
          </motion.div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 px-12 pb-2" style={{ marginTop: 'auto', marginBottom: 'auto', paddingTop: '3rem' }}>
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            <motion.p
              variants={fadeUp}
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 11,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: '#6366f1',
                fontWeight: 700,
                marginBottom: 20,
              }}
            >
              Infinite Canvas
            </motion.p>

            <motion.h1
              variants={fadeUp}
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 'clamp(42px, 4.5vw, 64px)',
                lineHeight: 1.08,
                color: '#f8f7f4',
                fontWeight: 900,
                letterSpacing: '-0.01em',
                marginBottom: 28,
              }}
            >
              Think in<br />
              <em style={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>space,</em><br />
              not lines.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              style={{
                fontFamily: "'Lora', serif",
                fontSize: 15,
                lineHeight: 1.75,
                color: 'rgba(255,255,255,0.38)',
                maxWidth: 340,
              }}
            >
              A freeform workspace where your ideas live as objects — connected, spatial, alive.
            </motion.p>
          </motion.div>
        </div>

        {/* Bottom caption */}
        <div className="relative z-10 px-12 pb-10">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 11,
              letterSpacing: '0.14em',
              color: 'rgba(255,255,255,0.18)',
              textTransform: 'uppercase',
            }}
          >
            Spatial · Creative · Infinite
          </motion.p>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 relative"
        style={{ background: '#111114' }}
      >
        {/* Subtle texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
            opacity: 0.6,
          }}
        />

        {/* Mobile logo */}
        <motion.div
          className="lg:hidden mb-10 text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-center gap-2.5 mb-1">
            <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }} />
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase' as const }}>
              MindCanvas
            </span>
          </div>
        </motion.div>

        <motion.div
          className="w-full relative z-10"
          style={{ maxWidth: 380 }}
          variants={stagger}
          initial="hidden"
          animate="show"
        >
          {/* Heading */}
          <motion.div variants={fadeUp} style={{ marginBottom: 40 }}>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 32,
                fontWeight: 700,
                color: '#f8f7f4',
                letterSpacing: '-0.01em',
                marginBottom: 6,
              }}
            >
              Welcome back
            </h2>
            <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.01em' }}>
              Sign in to your canvas
            </p>
          </motion.div>

          <form onSubmit={handleLogin}>
            {/* Email */}
            <motion.div variants={fadeUp} style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: 'block',
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.35)',
                  marginBottom: 8,
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  padding: '13px 16px',
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 14,
                  color: '#f8f7f4',
                  outline: 'none',
                  transition: 'border-color 0.2s, background 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)';
                  e.currentTarget.style.background = 'rgba(99,102,241,0.06)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }}
              />
            </motion.div>

            {/* Password */}
            <motion.div variants={fadeUp} style={{ marginBottom: 28 }}>
              <label
                style={{
                  display: 'block',
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.35)',
                  marginBottom: 8,
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    padding: '13px 44px 13px 16px',
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 14,
                    color: '#f8f7f4',
                    outline: 'none',
                    transition: 'border-color 0.2s, background 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)';
                    e.currentTarget.style.background = 'rgba(99,102,241,0.06)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.3)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                  }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </motion.div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  marginBottom: 20,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 12,
                  color: '#fca5a5',
                }}
              >
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <motion.div variants={fadeUp}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  border: 'none',
                  borderRadius: 12,
                  padding: '14px 20px',
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#ffffff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'opacity 0.2s, transform 0.15s',
                  boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {loading ? (
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </motion.div>
          </form>

          {/* Footer */}
          <motion.p
            variants={fadeUp}
            style={{
              textAlign: 'center',
              marginTop: 28,
              fontFamily: "'Syne', sans-serif",
              fontSize: 12,
              color: 'rgba(255,255,255,0.28)',
            }}
          >
            No account?{' '}
            <Link
              href="/signup"
              style={{
                color: '#818cf8',
                fontWeight: 600,
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              Create one
            </Link>
          </motion.p>
        </motion.div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          input::placeholder { color: rgba(255,255,255,0.2); }
        `}</style>
      </div>
    </div>
  );
}
