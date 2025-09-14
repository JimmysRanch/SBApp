'use client';
export const runtime = "nodejs";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function Logout() {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      await supabase.auth.signOut();
      router.replace('/login');
    })();
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-light via-primary to-primary-dark p-6 text-white">
      Signing you out…
    </div>
  );
}
