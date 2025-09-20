export const runtime = "nodejs";

import { redirect } from "next/navigation";

import { mapProfileRow } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", session!.user.id)
    .maybeSingle();

  const profile = mapProfileRow(data) ?? null;
  const role = profile?.role ?? "client";

  if (role === "client") {
    redirect("/client");
  }

  redirect("/dashboard");
}
