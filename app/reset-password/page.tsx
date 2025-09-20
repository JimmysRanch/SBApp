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
    <div className="relative flex min-h-screen w-full items-center justify-center px-4 py-16">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 top-6 h-72 w-72 rounded-full bg-brand-bubble/25 blur-[160px]" />
        <div className="absolute bottom-[-14rem] right-[-8rem] h-[30rem] w-[30rem] rounded-full bg-primary/25 blur-[220px]" />
      </div>
      {stage === 'request' ? (
        <form onSubmit={sendEmail} className="glass-panel w-full max-w-sm space-y-5 p-10 text-brand-cream">
          <h1 className="text-xl font-semibold text-brand-cream">Reset your password</h1>
          {err && <div className="rounded-2xl border border-brand-bubble/40 bg-brand-bubble/10 px-4 py-2 text-sm text-brand-bubble">{err}</div>}
          {msg && <div className="rounded-2xl border border-brand-mint/40 bg-brand-mint/10 px-4 py-2 text-sm text-brand-cream">{msg}</div>}
          <label className="block text-sm font-semibold text-brand-cream" htmlFor="reset-email">Email</label>
          <input
            id="reset-email"
            className="w-full"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="w-full rounded-full bg-gradient-to-r from-brand-bubble via-secondary.purple to-primary.light px-5 py-3 font-semibold text-white shadow-[0_24px_55px_-25px_rgba(255,10,120,0.6)] transition-transform hover:-translate-y-0.5">
            Send reset link
          </button>
        </form>
      ) : (
        <form onSubmit={doReset} className="glass-panel w-full max-w-sm space-y-4 p-10 text-brand-cream">
          <h1 className="text-xl font-semibold text-brand-cream">Set a new password</h1>
          {err && <div className="rounded-2xl border border-brand-bubble/40 bg-brand-bubble/10 px-4 py-2 text-sm text-brand-bubble">{err}</div>}
          {msg && <div className="rounded-2xl border border-brand-mint/40 bg-brand-mint/10 px-4 py-2 text-sm text-brand-cream">{msg}</div>}
          <label className="block text-sm font-semibold text-brand-cream" htmlFor="new-password">New password</label>
          <input
            id="new-password"
            className="w-full"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label className="block text-sm font-semibold text-brand-cream" htmlFor="confirm-password">Confirm password</label>
          <input
            id="confirm-password"
            className="w-full"
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <button className="w-full rounded-full bg-gradient-to-r from-brand-bubble via-secondary.purple to-primary.light px-5 py-3 font-semibold text-white shadow-[0_24px_55px_-25px_rgba(255,10,120,0.6)] transition-transform hover:-translate-y-0.5">
            Update password
          </button>
        </form>
      )}
    </div>
  );
}
