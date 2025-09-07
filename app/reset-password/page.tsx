"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

/*
 * ResetPassword
 *
 * Supabase sends password reset links with a one-time code as a query
 * parameter. This page exchanges that code for a session and then
 * provides a form for the user to set a new password. Upon successful
 * password update, the user is redirected to the dashboard.
 */
export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    // If there is no code, redirect to login
    if (!code) {
      router.replace("/login");
      return;
    }
    // Exchange code for session
    (async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setError(error.message);
        return;
      }
      setReady(true);
    })();
  }, [router, searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      return;
    }
    // Redirect to dashboard after successful password update
    router.replace("/dashboard");
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Preparing reset… {error && `Error: ${error}`}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-primary-light">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-80">
        <h2 className="text-xl font-semibold mb-4 text-center">Set a New Password</h2>
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm mb-1">New Password</label>
          <input
            id="password"
            type="password"
            className="w-full border rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="w-full bg-primary-dark text-white py-2 rounded hover:bg-primary-dark/90 transition">
          Save Password
        </button>
      </form>
    </div>
  );
}
