'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

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
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Create account</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border p-2" placeholder="Full name (optional)"
               value={fullName} onChange={e=>setFullName(e.target.value)} />
        <input className="w-full border p-2" placeholder="Email" type="email"
               value={email} onChange={e=>setEmail(e.target.value)} required />
        <input className="w-full border p-2" placeholder="Password" type="password"
               value={password} onChange={e=>setPassword(e.target.value)} required />
        <button className="w-full bg-blue-600 text-white p-2 rounded">Sign up</button>
      </form>
      <div className="mt-3 text-sm">
        <a className="text-blue-600 underline" href="/login">Already have an account? Log in</a>
      </div>
      {msg && <p className="mt-3 text-green-700">{msg}</p>}
      {err && <p className="mt-3 text-red-700">{err}</p>}
    </div>
  );
}
