'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null); setErr(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) return setErr(error.message);
    setMsg('Check your email to confirm your account.');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-light via-primary to-primary-dark p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl border border-primary-light/30 bg-white/90 p-8 shadow-lg backdrop-blur space-y-3">
        <h1 className="mb-4 text-2xl font-bold text-primary-dark">Create account</h1>
        <input className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary-light" placeholder="Full name (optional)"
               value={fullName} onChange={e=>setFullName(e.target.value)} />
        <input className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary-light" placeholder="Email" type="email"
               value={email} onChange={e=>setEmail(e.target.value)} required />
        <input className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary-light" placeholder="Password" type="password"
               value={password} onChange={e=>setPassword(e.target.value)} required />
        <button className="w-full rounded-md bg-primary px-4 py-2 font-medium text-white transition-colors hover:bg-primary-dark">Sign up</button>
        <div className="mt-3 text-sm text-center">
          <a className="text-primary-light underline transition-colors hover:text-primary-dark" href="/login">Already have an account? Log in</a>
        </div>
        {msg && <p className="mt-3 text-green-700">{msg}</p>}
        {err && <p className="mt-3 text-red-700">{err}</p>}
      </form>
    </div>
  );
}
