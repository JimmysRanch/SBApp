"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const code = sp.get("code");
    const type = sp.get("type"); // <- signup, magiclink, recovery, etc.

    if (!code) {
      router.replace("/login");
      return;
    }

    // If it's a password reset, send user to reset password screen
    if (type === "recovery") {
      router.replace(`/reset-password?code=${encodeURIComponent(code)}`);
      return;
    }

    // Otherwise (signup/magic-link), exchange code and go to dashboard
    (async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      router.replace(
        error
          ? `/login?error=${encodeURIComponent(error.message)}`
          : "/dashboard"
      );
    })();
  }, [router, sp]);

  return <p style={{ padding: 24 }}>Signing you in…</p>;
}
