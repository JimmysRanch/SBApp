'use client';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const router = useRouter();

  useEffect(() => {
    if (code) {
      (async () => {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          router.replace(`/login?error=${encodeURIComponent(error.message)}`);
        } else {
          router.replace('/dashboard');
        }
      })();
    } else {
      router.replace('/login');
    }
  }, [code, router]);

  return <p className="p-4">Completing sign-in…</p>;
}
