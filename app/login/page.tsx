// app/login/page.tsx
'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(params.get('error'));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErr(error.message);
      return;
    }
    router.replace('/dashboard');
  }

  return (
    <div className="mx-auto mt-16 max-w-md rounded border p-6">
      <h1 className="mb-4 text-2xl font-semibold">Sign in</h1>

      {err && <p className="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{err}</p>}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm">Email</label>
          <input
            type="email"
            className="mt-1 w-full rounded border px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label className="block text-sm">Password</label>
          <input
            type="password"
            className="mt-1 w-full rounded border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <button type="submit" className="w-full rounded bg-black px-3 py-2 text-white">
          Log in
        </button>
      </form>

      <div className="mt-4 flex justify-between text-sm">
        <Link className="text-blue-600 underline" href="/signup">Create account</Link>
        <Link className="text-blue-600 underline" href="/forgot-password">Forgot password?</Link>
      </div>
    </div>
  );
}
