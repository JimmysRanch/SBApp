'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function ResetPassword() {
  const sp = useSearchParams();
  const router = useRouter();
  const [pwd, setPwd] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const code = sp.get('code');
    if (!code) return;
    // Exchange OTP code for a session
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) setErr(error.message);
    });
  }, [sp]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null); setErr(null);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    if (error) return setErr(error.message);
    setMsg('Password updated. Redirecting to login...');
    setTimeout(() => router.replace('/login'), 1200);
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Set a new password</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border p-2" type="password" placeholder="New password"
               value={pwd} onChange={e=>setPwd(e.target.value)} required />
        <button className="w-full bg-blue-600 text-white p-2 rounded">Update password</button>
      </form>
      {msg && <p className="mt-3 text-green-700">{msg}</p>}
      {err && <p className="mt-3 text-red-700">{err}</p>}
    </div>
  );
}
