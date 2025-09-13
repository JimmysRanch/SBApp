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
      <Card>
        <h1 className="mb-6 text-3xl font-bold text-primary-dark">Book Appointment</h1>

        {session ? (
          <div className="mb-6 flex items-center justify-between rounded border p-3 text-sm">
            <span>Logged in as {session.user.email}</span>
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

