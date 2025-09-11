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
      className="w-full max-w-md rounded-xl border border-primary-light/30 bg-white/90 p-8 shadow-lg backdrop-blur"
    >
      <h1 className="mb-2 text-2xl font-bold text-primary-dark">
        Welcome back! <span className="ml-1">🐶</span>
      </h1>
      <p className="mb-6 text-sm text-gray-600">Sign in to continue.</p>

      {err && (
        <div className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      <label className="block text-sm font-medium text-gray-700">Email</label>
      <input
        className="mt-1 mb-3 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />

      <label className="block text-sm font-medium text-gray-700">Password</label>
      <input
        className="mt-1 mb-4 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-light"
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-primary px-4 py-2 font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
      >
        {loading ? 'Signing in…' : 'Sign in'}
      </button>

      <div className="mt-6 flex justify-between text-sm">
        <a className="text-primary-light underline transition-colors hover:text-primary-dark" href="/signup">
          Create account
        </a>
        <a className="text-primary-light underline transition-colors hover:text-primary-dark" href="/reset-password">
          Forgot password?
        </a>
      </div>
    </form>
  );
}
