'use client';

import { useId, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function LoginBanner() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const titleId = useId();
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.reload();
    } catch (e: any) {
      setErr(e?.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      aria-labelledby={titleId}
      aria-describedby={err ? errorId : undefined}
      className="glass-panel mb-6 flex flex-wrap items-center gap-3 bg-white/95 p-4 text-sm text-brand-navy"
    >
      <h2 id={titleId} className="sr-only">
        Inline login form
      </h2>
      <label htmlFor={emailId} className="sr-only">
        Email address
      </label>
      <input
        id={emailId}
        type="email"
        required
        autoComplete="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <label htmlFor={passwordId} className="sr-only">
        Password
      </label>
      <input
        id={passwordId}
        type="password"
        required
        autoComplete="current-password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button
        type="submit"
        disabled={loading}
        className="focus-ring rounded-full bg-brand-bubble px-4 py-2 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-bubbleDark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
      {err && (
        <span id={errorId} role="alert" className="ml-2 font-medium text-red-600">
          {err}
        </span>
      )}
    </form>
  );
}
