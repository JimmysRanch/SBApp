'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function LoginBanner() {
  const [email, setEmail] = useState('');
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
      window.location.reload();
    } catch (e: any) {
      setErr(e?.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="glass-panel mb-6 flex flex-wrap items-center gap-3 bg-[linear-gradient(150deg,rgba(8,12,28,0.92)_0%,rgba(8,36,90,0.75)_48%,rgba(5,6,18,0.9)_100%)] p-4 text-sm text-white/80 backdrop-saturate-150"
    >
      <input
        type="email"
        required
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="min-w-[160px] flex-1 rounded-2xl border-white/10 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/55 shadow-[0_16px_40px_-28px_rgba(8,36,90,0.8)] focus:border-brand-bubble focus:ring-brand-bubble/40"
      />
      <input
        type="password"
        required
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="min-w-[140px] flex-1 rounded-2xl border-white/10 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/55 shadow-[0_16px_40px_-28px_rgba(8,36,90,0.8)] focus:border-brand-bubble focus:ring-brand-bubble/40"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-gradient-to-r from-brand-bubble to-brand-bubbleDark px-4 py-2 font-semibold text-white shadow-[0_22px_40px_-24px_rgba(255,102,196,0.85)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_45px_-22px_rgba(255,61,158,0.9)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
      {err && (
        <span className="ml-2 rounded-full border border-red-500/30 bg-red-500/15 px-3 py-1 font-medium text-red-100">
          {err}
        </span>
      )}
    </form>
  );
}
