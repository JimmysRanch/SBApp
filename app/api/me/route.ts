import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
    error: sessErr,
  } = await supabase.auth.getSession();

  if (sessErr) {
    return NextResponse.json({ error: sessErr.message }, { status: 500 });
  }
  if (!session) {
    return NextResponse.json({ role: null, profile: null }, { status: 200 });
  }

  const { data: profileRow, error: profErr } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", session.user.id)
    .maybeSingle();

  if (profErr) {
    return NextResponse.json({ error: profErr.message }, { status: 500 });
  }

  const profile = profileRow ? { ...profileRow, email: session.user.email ?? null } : null;

  return NextResponse.json({
    role: profile?.role ?? null,
    profile: profile ?? null,
  });
}
