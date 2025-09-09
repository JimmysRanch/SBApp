'use client';

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
    <div className="min-h-[70vh] grid place-items-center px-6">
      {stage === 'request' ? (
        <form onSubmit={sendEmail} className="w-full max-w-sm rounded border bg-white p-6">
          <h1 className="text-xl font-semibold mb-4">Reset your password</h1>
          {err && <div className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
          {msg && <div className="mb-3 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</div>}
          <label className="block text-sm font-medium">Email</label>
          <input className="mt-1 mb-4 w-full rounded border px-3 py-2" type="email" required
                 value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="w-full rounded bg-black px-4 py-2 text-white">Send reset link</button>
        </form>
      ) : (
        <form onSubmit={doReset} className="w-full max-w-sm rounded border bg-white p-6">
          <h1 className="text-xl font-semibold mb-4">Set a new password</h1>
          {err && <div className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
          {msg && <div className="mb-3 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</div>}
          <label className="block text-sm font-medium">New password</label>
          <input className="mt-1 mb-3 w-full rounded border px-3 py-2" type="password" required
                 value={password} onChange={(e) => setPassword(e.target.value)} />
          <label className="block text-sm font-medium">Confirm password</label>
          <input className="mt-1 mb-4 w-full rounded border px-3 py-2" type="password" required
                 value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <button className="w-full rounded bg-black px-4 py-2 text-white">Update password</button>
        </form>
      )}
    </div>
  );
}
