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
    <form onSubmit={onSubmit} className="w-80 space-y-3">
      {err && (
        <div className="mb-2 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path d="M1.5 6.75A3.75 3.75 0 0 1 5.25 3h13.5A3.75 3.75 0 0 1 22.5 6.75v10.5A3.75 3.75 0 0 1 18.75 21H5.25A3.75 3.75 0 0 1 1.5 17.25V6.75Zm3.75-.75a.75.75 0 0 0-.75.75v.334l7.5 4.688 7.5-4.688V6.75a.75.75 0 0 0-.75-.75H5.25Zm14.25 3.091-6.956 4.348a.75.75 0 0 1-.788 0L4.8 9.091v8.159c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75V9.091Z" />
          </svg>
        </span>
        <input
          className="w-full rounded-full py-3 pl-12 pr-4 text-sm placeholder-gray-500 focus:outline-none"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="User@email.com"
        />
      </div>

      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75A3.75 3.75 0 0 0 7.5 22.5h9a3.75 3.75 0 0 0 3.75-3.75v-6.75a3 3 0 0 0-3-3v-3A5.25 5.25 0 0 0 12 1.5Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clipRule="evenodd" />
          </svg>
        </span>
        <input
          className="w-full rounded-full py-3 pl-12 pr-4 text-sm placeholder-gray-500 focus:outline-none"
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
        className="w-full rounded-full bg-blue-800 py-3 text-white disabled:opacity-60"
      >
        {loading ? 'Signing in…' : 'Log In'}
      </button>

      <div className="pt-2 text-center text-sm">
        <a className="text-white underline" href="/forgot-password">Forgot Password?</a>
        <a className="mt-2 block text-white underline" href="/signup">Sign up for an account</a>
      </div>
    </form>
  );
}
