'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { ScruffyIcon } from './icons';

export default function LoginForm() {
  const params = useSearchParams();

  const [email, setEmail] = useState(params.get('email') || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
    <form
      onSubmit={onSubmit}
      className="glass-panel w-full max-w-md space-y-5 bg-white/95 p-10 text-brand-navy"
    >
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-navy/60">
          Welcome back
        </p>
        <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight text-brand-navy">
          <span>Scruffy squad</span>
          <ScruffyIcon name="dog" size={28} className="text-brand-bubble" aria-hidden />
        </h1>
        <p className="text-sm text-brand-navy/70">Sign in to keep the tails wagging.</p>
      </div>

      {err && (
        <div className="rounded-2xl border border-red-300/60 bg-red-100/60 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

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

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-brand-bubble px-5 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-bubbleDark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>

      <div className="flex justify-between text-sm text-brand-navy/70">
        <a className="font-semibold text-brand-bubble transition-colors hover:text-brand-bubbleDark" href="/signup">
          Create account
        </a>
        <a className="font-semibold text-brand-bubble transition-colors hover:text-brand-bubbleDark" href="/reset-password">
          Forgot password?
        </a>
      </div>
    </form>
  );
}
