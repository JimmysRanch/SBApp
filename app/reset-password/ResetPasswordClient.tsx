'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function ResetPasswordClient() {
  const router = useRouter();
  const params = useSearchParams();

  const [stage, setStage] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL;
  const redirectTo = `${origin}/reset-password`;

  useEffect(() => {
    const type = params.get('type');
    const hasHash =
      typeof window !== 'undefined' && window.location.hash.includes('access_token');

    if (type === 'recovery' || hasHash) setStage('reset');

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setStage('reset');
    });
    return () => data.subscription.unsubscribe();
  }, [params]);

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
    if (password !== confirm) return setErr('Passwords do not match');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setErr(error.message);
    else {
      setMsg('Password updated. Redirecting to login…');
      setTimeout(() => router.replace('/login'), 1500);
    }
  };

  return (
    <>
      {stage === 'request' ? (
        <form onSubmit={sendEmail} className="glass-panel w-full max-w-sm space-y-4 p-8 text-brand-cream">
          <h1 className="text-xl font-semibold">Reset your password</h1>
          {err && <div className="rounded-2xl border border-brand-bubble/40 bg-brand-bubble/10 px-4 py-2 text-sm text-brand-bubble">{err}</div>}
          {msg && <div className="rounded-2xl border border-brand-mint/40 bg-brand-mint/10 px-4 py-2 text-sm text-brand-cream">{msg}</div>}
          <label className="block text-sm font-semibold text-brand-cream" htmlFor="inline-reset-email">Email</label>
          <input
            id="inline-reset-email"
            className="w-full"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <button className="w-full rounded-full bg-gradient-to-r from-brand-bubble via-secondary.purple to-primary.light px-5 py-3 font-semibold text-white shadow-[0_24px_55px_-25px_rgba(255,10,120,0.6)] transition-transform hover:-translate-y-0.5">
            Send reset link
          </button>
        </form>
      ) : (
        <form onSubmit={doReset} className="glass-panel w-full max-w-sm space-y-4 p-8 text-brand-cream">
          <h1 className="text-xl font-semibold">Set a new password</h1>
          {err && <div className="rounded-2xl border border-brand-bubble/40 bg-brand-bubble/10 px-4 py-2 text-sm text-brand-bubble">{err}</div>}
          {msg && <div className="rounded-2xl border border-brand-mint/40 bg-brand-mint/10 px-4 py-2 text-sm text-brand-cream">{msg}</div>}
          <label className="block text-sm font-semibold text-brand-cream" htmlFor="inline-new-password">New password</label>
          <input
            id="inline-new-password"
            className="w-full"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label className="block text-sm font-semibold text-brand-cream" htmlFor="inline-confirm-password">Confirm password</label>
          <input
            id="inline-confirm-password"
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
    </>
  );
}
