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
      <div className="relative flex min-h-[calc(100vh-8rem)] w-full items-center justify-center px-4 py-12 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-10 h-[28rem] w-[32rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[160px]" />
          <div className="absolute -right-24 bottom-0 h-[30rem] w-[30rem] rounded-full bg-secondary/15 blur-[200px]" />
        </div>
        <div className="relative grid w-full max-w-5xl gap-10 rounded-[2.5rem] border border-slate-200 bg-white/70 p-10 shadow-2xl shadow-slate-200/70 backdrop-blur-xl lg:grid-cols-[1fr,auto] lg:p-12">
          <div className="hidden max-w-md flex-col justify-between lg:flex">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                Scruffy Butts
              </span>
              <h1 className="text-4xl font-semibold text-brand-charcoal">
                A refined command center for every groomer on your team.
              </h1>
              <p className="text-base text-slate-600">
                Monitor appointments, balance workloads, and stay in sync with clients in one beautifully organized workspace.
              </p>
            </div>
            <div className="mt-12 grid gap-3 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                Real-time visibility across calendars and teams
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-secondary" />
                Lightning-fast booking and client management
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                Analytics that make growth decisions effortless
              </div>
            </div>
          </div>
          <LoginForm />
        </div>
      </div>
    </Suspense>
  );
}
