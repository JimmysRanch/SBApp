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
    <form onSubmit={onSubmit} className="mb-6 flex flex-wrap items-center gap-2 rounded border p-3 text-sm">
      <input
        type="email"
        required
        placeholder="Email"
        className="rounded border p-1"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        required
        placeholder="Password"
        className="rounded border p-1"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-primary px-3 py-1 text-white disabled:opacity-60"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
      {err && <span className="ml-2 text-red-600">{err}</span>}
    </form>
  );
}
