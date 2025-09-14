'use client';
export const runtime = "nodejs";

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null); setErr(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`,
    });

    if (error) return setErr(error.message);
    setMsg('Check your inbox for the reset link.');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-light via-primary to-primary-dark p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl border border-primary-light/30 bg-white/90 p-8 shadow-lg backdrop-blur space-y-3">
        <h1 className="mb-4 text-2xl font-bold text-primary-dark">Forgot password</h1>
        <input className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary-light" type="email" placeholder="Email"
               value={email} onChange={e=>setEmail(e.target.value)} required />
        <button className="w-full rounded-md bg-primary px-4 py-2 font-medium text-white transition-colors hover:bg-primary-dark">Send reset link</button>
        {msg && <p className="mt-3 text-green-700">{msg}</p>}
        {err && <p className="mt-3 text-red-700">{err}</p>}
      </form>
    </div>
  );
}
