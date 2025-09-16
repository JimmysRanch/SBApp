'use client';
export const runtime = "nodejs";

import { useId, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const headingId = useId();
  const emailId = useId();
  const errorId = useId();
  const messageId = useId();
  const describedByIds = [
    err ? errorId : null,
    msg ? messageId : null,
  ].filter((value): value is string => Boolean(value));
  const describedByAttr = describedByIds.length ? describedByIds.join(' ') : undefined;

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
      <form
        onSubmit={onSubmit}
        aria-labelledby={headingId}
        aria-describedby={describedByAttr}
        className="w-full max-w-md space-y-3 rounded-xl border border-primary-light/30 bg-white/90 p-8 shadow-lg backdrop-blur"
      >
        <h1 id={headingId} className="mb-4 text-2xl font-bold text-primary-dark">
          Forgot password
        </h1>
        <div className="space-y-1">
          <label htmlFor={emailId} className="block text-sm font-medium text-primary-dark">
            Email
          </label>
          <input
            id={emailId}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:ring-offset-2 focus:ring-offset-white"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </div>
        <button className="focus-ring w-full rounded-md bg-primary px-4 py-2 font-medium text-white transition-colors hover:bg-primary-dark">
          Send reset link
        </button>
        {msg && (
          <p id={messageId} role="status" aria-live="polite" className="mt-3 text-green-700">
            {msg}
          </p>
        )}
        {err && (
          <p id={errorId} role="alert" className="mt-3 text-red-700">
            {err}
          </p>
        )}
      </form>
    </div>
  );
}
