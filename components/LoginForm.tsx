/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

/**
 * Login form styled to match the Scruffy Butts branding shown in the
 * mock‑up.  The component handles the actual authentication while the UI
 * mimics the design with a gradient background, paw print pattern and
 * decorative grooming icons.
 */

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
    <div className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center text-white">
      {/* Background gradient and paw print pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500 to-blue-700">
        <div className="absolute inset-0 bg-[url('/paw.svg')] opacity-20 bg-repeat"></div>
      </div>

      {/* Heading */}
      <div className="relative z-10 flex flex-col items-center mb-6 text-center">
        <h1 className="text-5xl font-extrabold drop-shadow-md">
          Scruffy <span className="text-pink-400">Butts</span>
        </h1>
        <p className="mt-2 text-lg font-bold">DOG GROOMING</p>
        <p className="text-sm tracking-wide">NATALIA TX</p>
      </div>

      {/* Login card */}
      <form
        onSubmit={onSubmit}
        className="relative z-10 w-80 max-w-sm rounded-2xl bg-white p-6 text-gray-700"
      >
        {err && (
          <div className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}

        <div className="mb-4 flex items-center rounded-full border px-4 py-2">
          <img src="/envelope.svg" className="h-5 w-5 text-yellow-400" alt="email" />
          <input
            className="ml-2 w-full bg-transparent outline-none"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="User@email.com"
          />
        </div>

        <div className="mb-4 flex items-center rounded-full border px-4 py-2">
          <img src="/lock.svg" className="h-5 w-5 text-yellow-400" alt="password" />
          <input
            className="ml-2 w-full bg-transparent outline-none"
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
          className="w-full rounded-full bg-blue-600 py-2 text-white disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Log In'}
        </button>

        <div className="mt-4 text-center text-sm">
          <a className="text-blue-600 underline" href="/forgot-password">
            Forgot Password?
          </a>
          <div className="mt-2">
            <a className="text-blue-600 underline" href="/signup">
              Sign up for an account
            </a>
          </div>
        </div>
      </form>

      {/* Bottom pink cloud with grooming icons */}
      <div className="pointer-events-none absolute bottom-0 left-0 w-full">
        <div className="relative h-32 bg-pink-400 rounded-t-[50%] flex items-center justify-between px-10">
          <img src="/scissors.svg" className="h-12 w-12 text-yellow-400" alt="scissors" />
          <img src="/brush.svg" className="h-12 w-12 text-yellow-400" alt="brush" />
          <img src="/comb.svg" className="h-12 w-12 text-yellow-400" alt="comb" />
          <img src="/bone.svg" className="h-12 w-12 text-yellow-400" alt="bone" />
        </div>
      </div>
    </div>
  );
}
