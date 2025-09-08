'use client';

export const dynamic = 'force-dynamic';
export const revalidate = false;

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallbackPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [status, setStatus] = useState<'working'|'done'|'error'>('working');
  const [message, setMessage] = useState('Signing you in…');

  useEffect(() => {
    const run = async () => {
      // Supports both PKCE/code and email magic-link/recovery with hash
      try {
        const url = typeof window !== 'undefined' ? window.location.href : '';
        const code = search.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession({ code });
          if (error) throw error;
        } else if (url.includes('#')) {
          // Handle access_token in URL hash (magic link / recovery)
          const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
          if (error) throw error;
          if (!data.session) throw new Error('No session returned from redirect.');
        } else {
          throw new Error('Missing authorization information.');
        }

        setStatus('done');
        router.replace('/dashboard');
      } catch (err: any) {
        setStatus('error');
        setMessage(err?.message || 'Authentication failed.');
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[60vh] grid place-items-center px-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-xl font-semibold mb-2">
          {status === 'working' ? 'Please wait…' : status === 'done' ? 'Signed in' : 'Something went wrong'}
        </h1>
        <p className="text-sm text-gray-600">{message}</p>
        {status === 'error' && (
          <div className="mt-6">
            <a className="text-blue-600 underline" href="/login">Return to Login</a>
          </div>
        )}
      </div>
    </div>
  );
}
