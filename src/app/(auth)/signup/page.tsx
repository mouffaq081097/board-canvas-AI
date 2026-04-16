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

const inputStyle = {
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
  boxSizing: 'border-box' as const,
};

const labelStyle = {
  display: 'block',
  fontFamily: "'Syne', sans-serif",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  color: 'rgba(255,255,255,0.35)',
  marginBottom: 8,
};

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => { router.push('/dashboard'); router.refresh(); }, 1500);
    }
  };

  const focusInput = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)';
    e.currentTarget.style.background = 'rgba(99,102,241,0.06)';
  };
  const blurInput = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
  };

  return (
    <div className="min-h-screen flex overflow-hidden" style={{ fontFamily: "'Syne', sans-serif", background: '#0d0d0f' }}>

      {/* ── LEFT PANEL ─────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between relative overflow-hidden"
        style={{ width: '52%', background: '#0d0d0f', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(20, 1fr)', width: '100%', height: '100%', padding: '40px', gap: '0' }}>
            {DOT_GRID.map((i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 2, height: 2, borderRadius: '50%', background: '#ffffff', opacity: ((i * 13) % 100) > 40 ? 0.6 : 0.15 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Glow */}
        <div className="absolute pointer-events-none" style={{ width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-60%, -55%)' }} />

        {/* Wordmark */}
        <div className="relative z-10 px-12 pt-12">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex items-center gap-2.5">
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }} />
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase' }}>MindCanvas</span>
          </motion.div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 px-12" style={{ marginTop: 'auto', marginBottom: 'auto', paddingTop: '3rem' }}>
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.p variants={fadeUp} style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#8b5cf6', fontWeight: 700, marginBottom: 20 }}>
              Begin Here
            </motion.p>
            <motion.h1 variants={fadeUp} style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(42px, 4.5vw, 64px)', lineHeight: 1.08, color: '#f8f7f4', fontWeight: 900, letterSpacing: '-0.01em', marginBottom: 28 }}>
              Your ideas<br />
              <em style={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>deserve</em><br />
              more space.
            </motion.h1>
            <motion.p variants={fadeUp} style={{ fontFamily: "'Lora', serif", fontSize: 15, lineHeight: 1.75, color: 'rgba(255,255,255,0.38)', maxWidth: 340 }}>
              Join a workspace built for spatial thinkers — where every connection is visible, every idea has a place.
            </motion.p>
          </motion.div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 px-12 pb-10">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.6 }} style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase' }}>
            Free · No credit card · Instant access
          </motion.p>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative" style={{ background: '#111114' }}>
        {/* Noise */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`, opacity: 0.6 }} />

        {/* Mobile logo */}
        <motion.div className="lg:hidden mb-10 text-center" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center justify-center gap-2.5">
            <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }} />
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase' as const }}>MindCanvas</span>
          </div>
        </motion.div>

        <motion.div className="w-full relative z-10" style={{ maxWidth: 380 }} variants={stagger} initial="hidden" animate="show">

          {success ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#818cf8" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#f8f7f4', fontWeight: 700, marginBottom: 8 }}>Welcome aboard</p>
              <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Redirecting to your canvas…</p>
            </motion.div>
          ) : (
            <>
              {/* Heading */}
              <motion.div variants={fadeUp} style={{ marginBottom: 36 }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: '#f8f7f4', letterSpacing: '-0.01em', marginBottom: 6 }}>
                  Create account
                </h2>
                <p style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                  Your canvas awaits
                </p>
              </motion.div>

              <form onSubmit={handleSignup}>
                {/* Email */}
                <motion.div variants={fadeUp} style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
                </motion.div>

                {/* Password */}
                <motion.div variants={fadeUp} style={{ marginBottom: 18 }}>
                  <label style={labelStyle}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" required style={{ ...inputStyle, paddingRight: 44 }} onFocus={focusInput} onBlur={blurInput} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </motion.div>

                {/* Confirm password */}
                <motion.div variants={fadeUp} style={{ marginBottom: 28 }}>
                  <label style={labelStyle}>Confirm Password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required style={inputStyle} onFocus={focusInput} onBlur={blurInput} />
                </motion.div>

                {/* Error */}
                {error && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 20, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', fontFamily: "'Syne', sans-serif", fontSize: 12, color: '#fca5a5' }}>
                    {error}
                  </motion.div>
                )}

                {/* Submit */}
                <motion.div variants={fadeUp}>
                  <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', border: 'none', borderRadius: 12, padding: '14px 20px', fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', color: '#ffffff', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'opacity 0.2s, transform 0.15s', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}
                    onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    {loading ? (
                      <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                    ) : (
                      <><span>Create account</span><ArrowRight size={14} /></>
                    )}
                  </button>
                </motion.div>
              </form>

              <motion.p variants={fadeUp} style={{ textAlign: 'center', marginTop: 28, fontFamily: "'Syne', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.28)' }}>
                Already have an account?{' '}
                <Link href="/login" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }} onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')} onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}>
                  Sign in
                </Link>
              </motion.p>
            </>
          )}
        </motion.div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          input::placeholder { color: rgba(255,255,255,0.2); }
        `}</style>
      </div>
    </div>
  );
}
