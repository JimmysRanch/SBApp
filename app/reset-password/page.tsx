"use client";
import { Suspense, useEffect, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic"; // don't prerender

function ResetInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const code = sp.get("code");
    if (!code) {
      router.replace("/login");
      return;
    }
    (async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) { setErr(error.message); return; }
      setReady(true);
    })();
  }, [router, sp]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { setErr(error.message); return; }
    router.replace("/dashboard");
  }

  if (!ready) {
    return (
      <p style={{ padding: 24 }}>
        {err ? `Error: ${err}` : "Preparing password reset…"}
      </p>
    );
  }

  return (
    <form onSubmit={submit} style={{ padding: 24, maxWidth: 360 }}>
      <h1>Set a new password</h1>
      <input
        type="password"
        placeholder="New password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        required
        style={{ width: "100%", padding: 8, margin: "12px 0" }}
      />
      <button type="submit">Save password</button>
      {err && <p style={{ color: "red" }}>{err}</p>}
    </form>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p style={{ padding: 24 }}>Loading…</p>}>
      <ResetInner />
    </Suspense>
  );
}
