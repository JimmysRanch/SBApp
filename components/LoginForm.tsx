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
    <form onSubmit={onSubmit} className="w-full max-w-xs flex flex-col gap-4">
      {err && (
        <div className="rounded border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      <input
        className="rounded-md border px-4 py-3 shadow-sm placeholder-gray-400"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />

      <input
        className="rounded-md border px-4 py-3 shadow-sm placeholder-gray-400"
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />

      <div className="flex justify-end text-sm">
        <a className="text-blue-600 hover:underline" href="/reset-password">
          Forgot password?
        </a>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-blue-600 py-3 font-bold uppercase text-white shadow hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? 'Signing in…' : 'Log in'}
      </button>
    </form>
  );
}
