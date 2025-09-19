'use client';
export const runtime = "nodejs";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [stage, setStage] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const redirectTo = typeof window !== 'undefined'
    ? `${window.location.origin}/reset-password`
    : '';

  useEffect(() => {
    // If the user arrived via recovery email, Supabase sets PASSWORD_RECOVERY
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setStage('reset');
    });
    // Or token is already in the URL hash
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      setStage('reset');
    }
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setMsg(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) setErr(error.message);
    else setMsg('Check your email for a reset link.');
  };

  const doReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setMsg(null);
    if (password !== confirm) { setErr('Passwords do not match'); return; }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setErr(error.message);
    else {
      setMsg('Password updated. Redirecting to login…');
      setTimeout(() => router.replace('/login'), 1200);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-12 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[150px]" />
        <div className="absolute -right-24 bottom-0 h-[26rem] w-[26rem] rounded-full bg-secondary/15 blur-[190px]" />
      </div>
      {stage === 'request' ? (
        <form
          onSubmit={sendEmail}
          className="w-full max-w-sm space-y-4 rounded-[2.5rem] border border-slate-200 bg-white/85 p-10 text-brand-charcoal shadow-2xl shadow-slate-200/70 backdrop-blur"
        >
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Reset access</p>
            <h1 className="text-3xl font-semibold">Reset your password</h1>
            <p className="text-sm text-slate-500">We’ll send a link to the email associated with your account.</p>
          </div>
          {err && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">{err}</div>}
          {msg && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-600">{msg}</div>}
          <input
            className="w-full"
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="w-full rounded-2xl bg-primary px-5 py-3 text-base font-semibold text-white shadow-lg shadow-primary/30 transition hover:translate-y-[-2px] hover:bg-primary-dark">
            Send reset link
          </button>
        </form>
      ) : (
        <form
          onSubmit={doReset}
          className="w-full max-w-sm space-y-4 rounded-[2.5rem] border border-slate-200 bg-white/85 p-10 text-brand-charcoal shadow-2xl shadow-slate-200/70 backdrop-blur"
        >
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Almost there</p>
            <h1 className="text-3xl font-semibold">Set a new password</h1>
            <p className="text-sm text-slate-500">Enter and confirm your new credentials.</p>
          </div>
          {err && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">{err}</div>}
          {msg && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-600">{msg}</div>}
          <input
            className="w-full"
            type="password"
            required
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            className="w-full"
            type="password"
            required
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <button className="w-full rounded-2xl bg-primary px-5 py-3 text-base font-semibold text-white shadow-lg shadow-primary/30 transition hover:translate-y-[-2px] hover:bg-primary-dark">
            Update password
          </button>
        </form>
      )}
    </div>
  );
}
