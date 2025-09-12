"use client";

import PageContainer from '@/components/PageContainer';
import Card from '@/components/Card';
import LoginForm from '@/components/LoginForm';
import LogoutButton from '@/components/LogoutButton';
import BookingForm from '@/components/BookingForm';
import { Suspense, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

/**
 * Public booking page.  Shows a login form at the top so clients can quickly
 * sign in.  Once authenticated the full booking form is displayed allowing
 * owners to provide their information, dog details, upload vaccination
 * documents, sign the waiver and submit a grooming appointment request.
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

        {!session ? (
          // Login form shown when not authenticated
          <Suspense fallback={<div>Loading...</div>}>
            <LoginForm />
          </Suspense>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between rounded border p-3 text-sm">
              <span>Logged in as {session.user.email}</span>
              <LogoutButton />
            </div>
            <BookingForm />
          </div>
        )}
      </Card>
    </PageContainer>
  );
}

