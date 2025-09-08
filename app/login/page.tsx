'use client';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      router.replace('/dashboard');
    }
  };

  return (
    <div className="mx-auto mt-20 max-w-md rounded border p-6 shadow">
      <h1 className="mb-4 text-xl font-semibold">Log In</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="rounded border p-2"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="rounded border p-2"
          required
        />
        {error && <p className="text-red-600">{error}</p>}
        <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
          Log In
        </button>
      </form>
      <div className="mt-4 flex justify-between text-sm">
        <a className="text-blue-600 underline" href="/signup">Create account</a>
        <a className="text-blue-600 underline" href="/reset-password">Forgot password?</a>
      </div>
    </div>
  );
}
