'use client';

export const dynamic = 'force-dynamic';
export const revalidate = false;

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    // If arriving from Supabase recovery email, the URL hash contains tokens.
    // This call stores session if present; if not present, we still allow manual reset for an active session.
    const ensureSession = async () => {
      try {
        if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
          await supabase.auth.getSessionFromUrl({ storeSession: true });
        }
      } catch {
        // ignore—user might already be logged in or link already consumed
      } finally {
        setReady(true);
      }
    };
    ensureSession();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (pw1.length < 8) return setErr('Password must be at least 8 characters.');
    if (pw1 !== pw2) return setErr('Passwords do not match.');

    setWorking(true);
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    setWorking(false);

    if (error) {
      setErr(error.message);
      return;
    }
    setOk(true);
    setTimeout(() => router.replace('/login'), 1200);
  };

  if (!ready) {
    return (
      <div className="min-h-[60vh] grid place-items-center px-6">
        <p className="text-sm text-gray-600">Preparing password reset…</p>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] grid place-items-center px-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg border p-6 bg-white">
        <h1 className="text-xl font-semibold mb-4">Set a new password</h1>

        {err && (
          <div className="mb-3 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {err}
          </div>
        )}
        {ok && (
          <div className="mb-3 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
            Password updated. Redirecting to login…
          </div>
        )}

        <label className="block text-sm font-medium">New password</label>
        <input
          className="mt-1 mb-3 w-full rounded border px-3 py-2"
          type="password"
          required
          value={pw1}
          onChange={(e) => setPw1(e.target.value)}
          placeholder="At least 8 characters"
        />

        <label className="block text-sm font-medium">Confirm new password</label>
        <input
          className="mt-1 mb-4 w-full rounded border px-3 py-2"
          type="password"
          required
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          placeholder="Re-enter password"
        />

        <button
          type="submit"
          disabled={working}
          className="w-full rounded bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {working ? 'Updating…' : 'Update password'}
        </button>

        <div className="mt-4 text-center">
          <a className="text-blue-600 underline text-sm" href="/login">Back to login</a>
        </div>
      </form>
    </div>
  );
}
