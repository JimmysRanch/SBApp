"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function CallbackInner() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const code = sp.get("code");
    const type = sp.get("type"); // signup | magiclink | recovery

    if (!code) {
      router.replace("/login");
      return;
    }

    // Password reset links go to /reset-password
    if (type === "recovery") {
      router.replace(`/reset-password?code=${encodeURIComponent(code)}`);
      return;
    }

    // Normal magic link / signup: exchange and go to dashboard
    (async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      router.replace(
        error ? `/login?error=${encodeURIComponent(error.message)}` : "/dashboard"
      );
    })();
  }, [router, sp]);

  return <p style={{ padding: 24 }}>Signing you in…</p>;
}

export default function Page() {
  return (
    <Suspense fallback={<p style={{ padding: 24 }}>Loading…</p>}>
      <CallbackInner />
    </Suspense>
  );
}
