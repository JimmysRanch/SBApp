'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      setMsg('Signed in. Redirecting…');

      // 1) Client-side nav
      router.replace('/dashboard');

      // 2) Refresh in case the page is cached
      router.refresh();

      // 3) Hard fallback (covers any router edge cases)
      setTimeout(() => {
        if (typeof window !== 'undefined') window.location.assign('/dashboard');
      }, 300);
    } catch (e: any) {
      setErr(e?.message ?? 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] grid place-items-center px-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-lg border p-6 bg-white">
        <h1 className="text-xl font-semibold mb-4">Log in</h1>

        {err && (
          <div className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}
        {msg && (
          <div className="mb-3 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
            {msg}
          </div>
        )}

        <label className="block text-sm font-medium">Email</label>
        <input
          className="mt-1 mb-3 w-full rounded border px-3 py-2"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />

        <label className="block text-sm font-medium">Password</label>
        <input
          className="mt-1 mb-4 w-full rounded border px-3 py-2"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <div className="mt-4 flex justify-between text-sm">
          <a className="text-blue-600 underline" href="/signup">Create account</a>
          <a className="text-blue-600 underline" href="/reset-password">Forgot password?</a>
        </div>
      </form>
    </div>
  );
}
