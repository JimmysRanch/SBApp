'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function CallbackPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    (async () => {
      try {
        // OAuth (PKCE) flow: `?code=...`
        const code = params.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          router.replace('/dashboard');
          return;
        }

        // Magic link / recovery flow: tokens in URL hash
        const url = window.location.href;
        if (url.includes('#')) {
          const hash = url.split('#')[1];
          const qp = new URLSearchParams(hash);
          const access_token = qp.get('access_token');
          const refresh_token = qp.get('refresh_token');
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) throw error;
            router.replace('/dashboard');
            return;
          }
        }

        // Fallback
        router.replace('/login?error=Missing+auth+code');
      } catch (e: any) {
        router.replace('/login?error=' + encodeURIComponent(e?.message || 'Auth error'));
      }
    })();
  }, [params, router]);

  return (
    <div className="min-h-[60vh] grid place-items-center p-6 text-sm">
      Signing you in…
    </div>
  );
}
