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
      className="mb-6 flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white/85 p-5 text-sm text-brand-charcoal shadow-xl shadow-slate-200/60 backdrop-blur"
    >
      <input
        type="email"
        required
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        required
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-2xl bg-primary px-4 py-2 font-semibold text-white shadow-md shadow-primary/30 transition hover:translate-y-[-2px] hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
      {err && <span className="ml-2 font-medium text-rose-600">{err}</span>}
    </form>
  );
}
