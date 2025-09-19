"use client";

import PageContainer from '@/components/PageContainer';
import Card from '@/components/Card';
import LogoutButton from '@/components/LogoutButton';
import BookingForm from '@/components/BookingForm';
import LoginBanner from '@/components/LoginBanner';
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

/**
 * Public booking page.  Displays an optional login banner so clients can
 * sign in, but the booking form is available without authentication. Owners
 * can enter their information, dog details, upload vaccination documents and
 * submit a grooming appointment request.
 */
export default function BookPage() {
  const [session, setSession] = useState<Session | null>(null);

  // Listen for auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) =>
      setSession(s)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <PageContainer>
      <Card className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Client portal</p>
          <h1 className="text-3xl font-semibold text-brand-charcoal">Book an appointment</h1>
          <p className="text-sm text-slate-500">Share your pup’s details and we’ll prepare the perfect grooming experience.</p>
        </div>

        {session ? (
          <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600 shadow-inner shadow-slate-200/40 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Logged in as <span className="font-semibold text-brand-charcoal">{session.user.email}</span>
            </span>
            <LogoutButton />
          </div>
        ) : (
          <LoginBanner />
        )}

        <BookingForm />
      </Card>
    </PageContainer>
  );
}

