'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

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
      className="flex w-full max-w-xs flex-col rounded-xl bg-black/60 p-4"
    >
      {err && (
        <div className="mb-2 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}
      <label htmlFor="email" className="sr-only">
        Email
      </label>
      <input
        id="email"
        className="mb-3 rounded-md bg-white/80 px-3 py-2 text-black placeholder-gray-700"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="name@email.com"
      />
      <label htmlFor="password" className="sr-only">
        Password
      </label>
      <input
        id="password"
        className="mb-4 rounded-md bg-white/80 px-3 py-2 text-black placeholder-gray-700"
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="password"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-pink-600 py-2 text-white disabled:opacity-60"
      >
        {loading ? 'Signing in…' : 'LOGIN'}
      </button>
    </form>
  );
}
