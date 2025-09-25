export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { normaliseRole } from "@/lib/auth/profile";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await request.json().catch(() => ({}));
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const { data: inv, error: invErr } = await supabase
    .from("staff_invites")
    .select("id, business_id, email, role, accepted_at")
    .eq("token", token)
    .maybeSingle();
  if (invErr || !inv) return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
  if (inv.accepted_at) return NextResponse.json({ error: "Invite already used" }, { status: 400 });
  if (session.user.email?.toLowerCase() !== inv.email.toLowerCase()) {
    return NextResponse.json({ error: "Invite email mismatch" }, { status: 403 });
  }

  const inviteRole = normaliseRole(inv.role);

  // Link profile to business and role
  const { error: upErr } = await supabase
    .from("profiles")
    .update({
      business_id: inv.business_id,
      role: inviteRole,
    })
    .eq("id", session.user.id);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

  // Ensure employees row
  const { error: empErr } = await supabase
    .from("employees")
    .upsert(
      {
        user_id: session.user.id,
        name: session.user.email ?? "Staff",
        active: true,
        role: inviteRole,
        business_id: inv.business_id,
        app_permissions: inviteRole === "manager" ? { dashboard: true } : {},
      },
      { onConflict: "user_id" }
    );
  if (empErr) return NextResponse.json({ error: empErr.message }, { status: 400 });

  // Mark accepted
  const { error: accErr } = await supabase.from("staff_invites").update({ accepted_at: new Date().toISOString() }).eq("id", inv.id);
  if (accErr) return NextResponse.json({ error: accErr.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
