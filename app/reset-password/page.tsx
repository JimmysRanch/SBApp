'use client';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

function ResetInner() {
  const search = useSearchParams();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState<string>('');
  const [ok, setOk] = useState<string>('');

  // If the email link includes a one-time code (?code=...), exchange it first.
  useEffect(() => {
    const code = search.get('code');
    (async () => {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setError(error.message);
          return;
        }
      }
      setReady(true);
    })();
  }, [search]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOk('');
    if (pw1 !== pw2) return setError('Passwords do not match.');
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    if (error) setError(error.message);
    else {
      setOk('Password updated. Redirecting to login…');
      setTimeout(() => router.replace('/login'), 1200);
    }
  };

  if (!ready) return <div className="p-6">Loading…</div>;

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Set a new password</h1>
      {error && <div className="mb-3 text-red-600">{error}</div>}
      {ok && <div className="mb-3 text-green-600">{ok}</div>}
      <form onSubmit={submit} className="space-y-3">
        <input
          className="w-full border rounded px-3 py-2"
          type="password"
          placeholder="New password"
          value={pw1}
          onChange={e => setPw1(e.target.value)}
          required
        />
        <input
          className="w-full border rounded px-3 py-2"
          type="password"
          placeholder="Confirm new password"
          value={pw2}
          onChange={e => setPw2(e.target.value)}
          required
        />
        <button className="w-full rounded bg-blue-600 text-white py-2" type="submit">
          Update password
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <ResetInner />
    </Suspense>
  );
}
