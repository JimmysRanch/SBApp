"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

/*
 * AuthCallback
 *
 * This page handles magic link logins, email confirmations, and other
 * code-based auth flows from Supabase. When a user clicks on a magic link
 * or password reset link in their email, Supabase will redirect back
 * to the URL provided in the `emailRedirectTo` parameter. This page
 * extracts the `code` query parameter from the URL, exchanges it for
 * a user session via Supabase, and then redirects the user to the
 * dashboard on success or back to the login page on failure.
 */
export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    // If there is no code in the URL, redirect back to login
    if (!code) {
      router.replace("/login");
      return;
    }
    // Exchange the one-time code from the URL for a valid session
    (async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        // If something goes wrong, send the user back to login with an error
        router.replace(`/login?error=${encodeURIComponent(error.message)}`);
      } else {
        // On success, take the user to the dashboard
        router.replace("/dashboard");
      }
    })();
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg">Signing you in…</p>
    </div>
  );
}
