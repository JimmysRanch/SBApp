'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');

    // Also handle magic-link / recovery links that put tokens in the URL hash
    const hash = url.hash || '';
    const accessTokenMatch = hash.match(/access_token=([^&]+)/);
    const refreshTokenMatch = hash.match(/refresh_token=([^&]+)/);

    (async () => {
      try {
        if (code) {
          // NOTE: pass the string, not { code }
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          router.replace('/dashboard');
          return;
        }

        if (accessTokenMatch) {
          const access_token = decodeURIComponent(accessTokenMatch[1]);
          const refresh_token = decodeURIComponent(refreshTokenMatch?.[1] ?? '');
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;
          router.replace('/dashboard');
          return;
        }

        // No code/tokens — send them to login
        router.replace('/login');
      } catch {
        router.replace('/login?error=auth');
      }
    })();
  }, [router]);

  return null;
}
