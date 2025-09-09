'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        // 1) OAuth / PKCE: /auth/callback?code=...
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          router.replace('/dashboard');
          return;
        }

        // 2) Magic link / recovery tokens in URL hash (#access_token=...)
        if (url.hash.includes('access_token')) {
          const qp = new URLSearchParams(url.hash.slice(1));
          const access_token = qp.get('access_token')!;
          const refresh_token = qp.get('refresh_token')!;
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;
          router.replace('/dashboard');
          return;
        }

        router.replace('/login?error=Missing+auth+code');
      } catch (e: any) {
        router.replace('/login?error=' + encodeURIComponent(e?.message || 'Auth error'));
      }
    })();
  }, [router]);

  return <div className="min-h-[60vh] grid place-items-center p-6 text-sm">Signing you in…</div>;
}
