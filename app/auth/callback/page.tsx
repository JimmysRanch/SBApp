'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href);

        // OAuth (PKCE) code in query
        const code = url.searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          router.replace('/dashboard');
          return;
        }

        // Magic link / recovery tokens in hash
        if (url.hash.includes('access_token')) {
          const hash = new URLSearchParams(url.hash.slice(1));
          const access_token = hash.get('access_token') || '';
          const refresh_token = hash.get('refresh_token') || '';
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) throw error;
            router.replace('/dashboard');
            return;
          }
        }

        router.replace('/login?error=Missing+auth+params');
      } catch (e: any) {
        router.replace('/login?error=' + encodeURIComponent(e?.message || 'Auth error'));
      }
    })();
  }, [router]);

  return <div className="min-h-[60vh] grid place-items-center p-6 text-sm">Signing you in…</div>;
}
