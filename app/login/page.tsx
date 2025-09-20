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
      <div className="relative flex min-h-[calc(100vh-6rem)] w-full items-center justify-center px-4 pb-16 pt-12">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(30,123,255,0.2),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,102,196,0.2),transparent_60%)]" />
          <div className="absolute -left-24 top-6 h-80 w-80 rounded-full bg-primary/25 blur-[200px]" />
          <div className="absolute bottom-[-14rem] right-[-6rem] h-[30rem] w-[30rem] rounded-full bg-brand-obsidian/70 blur-[220px]" />
        </div>
        <LoginForm />
      </div>
    </Suspense>
  );
}
