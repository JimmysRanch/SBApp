'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function Logout() {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      await supabase.auth.signOut();
      router.replace('/login');
    })();
  }, [router]);
  return <div className="p-6">Signing you out…</div>;
}
