"use client";
import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * Logout page.  Signs the user out of Supabase and redirects
 * back to the login screen.  Display a message while in progress.
 */
export default function LogoutPage() {
  useEffect(() => {
    const signOut = async () => {
      await supabase.auth.signOut();
      window.location.href = "/login";
    };
    signOut();
  }, []);
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Signing you out...</p>
    </div>
  );
}