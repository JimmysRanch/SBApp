'use client';
export const runtime = "nodejs";

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
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-12 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[160px]" />
        <div className="absolute -right-28 bottom-0 h-[28rem] w-[28rem] rounded-full bg-secondary/15 blur-[200px]" />
      </div>
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-4 rounded-[2.5rem] border border-slate-200 bg-white/85 p-10 text-brand-charcoal shadow-2xl shadow-slate-200/70 backdrop-blur"
      >
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Welcome</p>
          <h1 className="text-3xl font-semibold">Create your team account</h1>
          <p className="text-sm text-slate-500">Invite your teammates later from settings.</p>
        </div>
        <input
          className="w-full"
          placeholder="Full name (optional)"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
        />
        <input
          className="w-full"
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full"
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button className="w-full rounded-2xl bg-primary px-5 py-3 text-base font-semibold text-white shadow-lg shadow-primary/30 transition hover:translate-y-[-2px] hover:bg-primary-dark">
          Sign up
        </button>
        <div className="mt-3 text-center text-sm text-slate-600">
          <a className="font-semibold text-primary hover:text-primary-dark" href="/login">
            Already have an account? Log in
          </a>
        </div>
        {msg && <p className="text-sm font-medium text-emerald-600">{msg}</p>}
        {err && <p className="text-sm font-medium text-rose-600">{err}</p>}
      </form>
    </div>
  );
}
