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
      <div className="relative flex min-h-[calc(100vh-8rem)] w-full items-center justify-center overflow-hidden px-4 pb-24 pt-16">
        <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.2),transparent_55%),radial-gradient(circle_at_bottom,_rgba(124,58,237,0.25),transparent_65%)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-70">
          <div className="absolute inset-0 bg-[conic-gradient(from_130deg_at_50%_50%,rgba(34,211,238,0.15),rgba(124,58,237,0.25),transparent)] blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(0deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:120px_120px]" />
          <div className="absolute -left-32 top-20 h-64 w-64 rounded-full bg-brand-bubble/20 blur-[150px]" />
          <div className="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-primary/25 blur-[170px]" />
        </div>
        <LoginForm />
      </div>
    </Suspense>
  );
}
