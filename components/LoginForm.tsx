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
      window.location.href = '/dashboard';
    } catch (e: any) {
      setErr(e?.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="w-full max-w-xs text-center">
      {err && (
        <div className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      <div className="relative mb-4">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-yellow-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.02 1.89l-7.5 4.875a2.25 2.25 0 01-2.46 0L3.27 8.883a2.25 2.25 0 01-1.02-1.89V6.75"
            />
          </svg>
        </div>
        <input
          className="w-full rounded-full border py-2 pl-10 pr-3 placeholder-gray-500"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="User@email.com"
        />
      </div>

      <div className="relative mb-6">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-yellow-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-1.5 0h12a2.25 2.25 0 012.25 2.25v6.75a2.25 2.25 0 01-2.25 2.25h-12A2.25 2.25 0 012 19.5v-6.75a2.25 2.25 0 012.25-2.25z"
            />
          </svg>
        </div>
        <input
          className="w-full rounded-full border py-2 pl-10 pr-3"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-blue-800 py-2 text-white disabled:opacity-60"
      >
        {loading ? 'Signing in…' : 'Log In'}
      </button>

      <div className="mt-4 space-y-2 text-sm">
        <a className="block text-white underline" href="/reset-password">
          Forgot Password?
        </a>
        <a className="block text-white underline" href="/signup">
          Sign up for an account
        </a>
      </div>
    </form>
  );
}
