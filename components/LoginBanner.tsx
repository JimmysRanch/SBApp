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
      className="glass-panel mb-6 flex flex-wrap items-center gap-3 bg-white/95 p-4 text-sm text-brand-navy"
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
        className="rounded-full bg-brand-bubble px-4 py-2 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-bubbleDark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
      {err && <span className="ml-2 font-medium text-red-600">{err}</span>}
    </form>
  );
}
