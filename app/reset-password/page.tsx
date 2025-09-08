'use client';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code'); // magic link code
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setMessage(error ? error.message : 'Reset link sent to your email.');
  };

  const setPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setMessage(error ? error.message : 'Password updated, redirecting…');
    if (!error) router.replace('/login');
  };

  return (
    <div className="mx-auto mt-20 max-w-md rounded border p-6 shadow">
      <h1 className="mb-4 text-xl font-semibold">Reset Password</h1>
      {!code ? (
        <form onSubmit={requestReset} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="rounded border p-2"
            required
          />
          <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
            Send Reset Link
          </button>
        </form>
      ) : (
        <form onSubmit={setPassword} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="rounded border p-2"
            required
          />
          <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
            Update Password
          </button>
        </form>
      )}
      {message && <p className="mt-3 text-sm text-gray-700">{message}</p>}
    </div>
  );
}
