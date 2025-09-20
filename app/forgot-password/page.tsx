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
    <div className="relative flex min-h-screen w-full items-center justify-center px-4 py-16">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-28 top-8 h-72 w-72 rounded-full bg-brand-bubble/25 blur-[160px]" />
        <div className="absolute bottom-[-12rem] right-[-6rem] h-[28rem] w-[28rem] rounded-full bg-primary/25 blur-[210px]" />
      </div>
      <form onSubmit={onSubmit} className="glass-panel w-full max-w-md space-y-5 p-10 text-brand-cream">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-brand-cream">Forgot password</h1>
          <p className="text-sm text-brand-cream/70">We’ll send a secure link to reset your credentials.</p>
        </div>
        <input
          className="w-full"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button className="w-full rounded-full bg-gradient-to-r from-brand-bubble via-secondary.purple to-primary.light px-5 py-3 font-semibold text-white shadow-[0_24px_55px_-25px_rgba(255,10,120,0.6)] transition-transform hover:-translate-y-0.5">
          Send reset link
        </button>
        {msg && <p className="text-sm text-brand-mint">{msg}</p>}
        {err && <p className="text-sm text-brand-bubble">{err}</p>}
      </form>
    </div>
  );
}
