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
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-12 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[150px]" />
        <div className="absolute -right-24 bottom-0 h-[26rem] w-[26rem] rounded-full bg-secondary/15 blur-[190px]" />
      </div>
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-4 rounded-[2.5rem] border border-slate-200 bg-white/85 p-10 text-brand-charcoal shadow-2xl shadow-slate-200/70 backdrop-blur"
      >
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Reset access</p>
          <h1 className="text-3xl font-semibold">Forgot password</h1>
          <p className="text-sm text-slate-500">We’ll email you a link to create a new password.</p>
        </div>
        <input
          className="w-full"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button className="w-full rounded-2xl bg-primary px-5 py-3 text-base font-semibold text-white shadow-lg shadow-primary/30 transition hover:translate-y-[-2px] hover:bg-primary-dark">
          Send reset link
        </button>
        {msg && <p className="text-sm font-medium text-emerald-600">{msg}</p>}
        {err && <p className="text-sm font-medium text-rose-600">{err}</p>}
      </form>
    </div>
  );
}
