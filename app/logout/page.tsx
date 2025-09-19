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
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12 text-brand-charcoal">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-12 h-[20rem] w-[20rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" />
      </div>
      <div className="rounded-[2.5rem] border border-slate-200 bg-white/85 px-10 py-8 text-center text-sm shadow-2xl shadow-slate-200/70 backdrop-blur">
        Signing you out…
      </div>
    </div>
  );
}
