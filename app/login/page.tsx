'use client';
export const runtime = "nodejs";

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/dashboard');
    });
  }, [router]);

  return (
    <Suspense fallback={null}>
      <div className="relative flex min-h-[calc(100vh-6rem)] w-full items-center justify-center px-6 pb-20 pt-14">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(77,104,255,0.25),_transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(246,169,47,0.2),_transparent_60%)]" />
          <div className="absolute left-1/2 top-[15%] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-brand-lavender/20 blur-[200px]" />
          <div className="absolute -right-28 bottom-[-10rem] h-[32rem] w-[32rem] rounded-full bg-brand-mint/15 blur-[200px]" />
        </div>
        <LoginForm />
      </div>
    </Suspense>
  );
}
