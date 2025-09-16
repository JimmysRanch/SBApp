'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';

export default function LoginForm() {
  const params = useSearchParams();

  const [email, setEmail] = useState(params.get('email') || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const shouldReduceMotion = useReducedMotion();

  const formMotionProps = shouldReduceMotion
    ? { initial: false }
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: 'easeOut' as const }
      };

  const buttonAnimation = useMemo(() => {
    if (shouldReduceMotion) return {};
    if (loading) {
      return { scale: [1, 0.96, 1], boxShadow: ['0px 20px 40px rgba(14, 24, 63, 0.18)', '0px 10px 24px rgba(14, 24, 63, 0.1)', '0px 20px 40px rgba(14, 24, 63, 0.18)'] };
    }
    return { scale: 1, boxShadow: '0px 20px 40px rgba(14, 24, 63, 0.18)' };
  }, [loading, shouldReduceMotion]);

  const buttonTransition = useMemo(() => {
    if (shouldReduceMotion) return { duration: 0 } as const;
    if (loading) {
      return {
        duration: 0.9,
        repeat: Infinity,
        repeatType: 'mirror' as const,
        ease: 'easeInOut' as const
      };
    }
    return { type: 'spring' as const, stiffness: 320, damping: 28 };
  }, [loading, shouldReduceMotion]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Use a full page reload so server components can pick up the new session.
      window.location.href = '/';
    } catch (e: any) {
      setErr(e?.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      onSubmit={onSubmit}
      className="glass-panel w-full max-w-md space-y-5 bg-white/95 p-10 text-brand-navy"
      {...formMotionProps}
    >
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-navy/60">
          Welcome back
        </p>
        <h1 className="text-3xl font-black tracking-tight text-brand-navy">
          Scruffy squad <span className="ml-1">🐶</span>
        </h1>
        <p className="text-sm text-brand-navy/70">Sign in to keep the tails wagging.</p>
      </div>

      <AnimatePresence initial={false}>
        {err && (
          <motion.div
            key="error"
            initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.25, ease: 'easeOut' as const }
            }
            className="rounded-2xl border border-red-300/60 bg-red-100/60 px-3 py-2 text-sm text-red-700"
          >
            {err}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="block text-sm font-semibold text-brand-navy">Email</label>
          <input
            className="w-full"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-semibold text-brand-navy">Password</label>
          <input
            className="w-full"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
      </div>

      <motion.button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-brand-bubble px-5 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-bubbleDark disabled:cursor-not-allowed disabled:opacity-60"
        whileHover={shouldReduceMotion ? undefined : { y: -2 }}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
        animate={buttonAnimation}
        transition={buttonTransition}
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </motion.button>

      <div className="flex justify-between text-sm text-brand-navy/70">
        <a className="font-semibold text-brand-bubble transition-colors hover:text-brand-bubbleDark" href="/signup">
          Create account
        </a>
        <a className="font-semibold text-brand-bubble transition-colors hover:text-brand-bubbleDark" href="/reset-password">
          Forgot password?
        </a>
      </div>
    </motion.form>
  );
}
