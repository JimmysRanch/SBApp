'use client';
export const runtime = "nodejs";

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const headingId = useId();
  const fullNameId = useId();
  const emailId = useId();
  const passwordId = useId();
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-light via-primary to-primary-dark p-4">
      <form
        onSubmit={onSubmit}
        aria-labelledby={headingId}
        aria-describedby={describedByAttr}
        className="w-full max-w-md space-y-3 rounded-xl border border-primary-light/30 bg-white/90 p-8 shadow-lg backdrop-blur"
      >
        <h1 id={headingId} className="mb-4 text-2xl font-bold text-primary-dark">
          Create account
        </h1>
        <div className="space-y-1">
          <label htmlFor={fullNameId} className="block text-sm font-medium text-primary-dark">
            Full name (optional)
          </label>
          <input
            id={fullNameId}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:ring-offset-2 focus:ring-offset-white"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            placeholder="Full name"
          />
        </div>
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
        <div className="space-y-1">
          <label htmlFor={passwordId} className="block text-sm font-medium text-primary-dark">
            Password
          </label>
          <input
            id={passwordId}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-navy focus:ring-offset-2 focus:ring-offset-white"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            placeholder="Password"
          />
        </div>
        <button className="focus-ring w-full rounded-md bg-primary px-4 py-2 font-medium text-white transition-colors hover:bg-primary-dark">
          Sign up
        </button>
        <div className="mt-3 text-center text-sm">
          <a className="focus-ring text-primary-light underline transition-colors hover:text-primary-dark" href="/login">
            Already have an account? Log in
          </a>
        </div>
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
