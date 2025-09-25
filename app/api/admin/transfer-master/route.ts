export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await supabase.from("profiles").select("id, role, business_id").eq("id", session.user.id).maybeSingle();
  if (me.error || !me.data?.business_id) return NextResponse.json({ error: "No business" }, { status: 403 });
  if (String(me.data.role) !== "Master Account") return NextResponse.json({ error: "Only Master can transfer" }, { status: 403 });

  const { targetUserId } = await request.json().catch(() => ({}));
  if (!targetUserId) return NextResponse.json({ error: "Missing targetUserId" }, { status: 400 });

  // Demote any master in same business except target
  const demote = await supabase.from("profiles").update({ role: "Manager" })
    .eq("business_id", me.data.business_id)
    .eq("role", "Master Account")
    .neq("id", targetUserId);
  if (demote.error) return NextResponse.json({ error: demote.error.message }, { status: 400 });

  // Promote target
  const promote = await supabase.from("profiles").update({ role: "Master Account" })
    .eq("id", targetUserId).eq("business_id", me.data.business_id);
  if (promote.error) return NextResponse.json({ error: promote.error.message }, { status: 400 });

  // Ensure employees row for target
  await supabase.from("employees").upsert({
    user_id: targetUserId, name: "Owner", active: true, role: "Manager",
    business_id: me.data.business_id, app_permissions: { dashboard: true }
  }, { onConflict: "user_id" });

  return NextResponse.json({ ok: true });
}
