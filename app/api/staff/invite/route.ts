export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await supabase.from("profiles").select("id, role, business_id").eq("id", session.user.id).maybeSingle();
  if (me.error || !me.data?.business_id) return NextResponse.json({ error: "No business" }, { status: 403 });
  if (!["Master Account","Manager"].includes(String(me.data.role))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { email, role } = await request.json().catch(() => ({}));
  if (!email || !role || !["Manager","Front Desk","Groomer"].includes(role)) {
    return NextResponse.json({ error: "Invalid email/role" }, { status: 400 });
  }

  const token = randomBytes(24).toString("hex");
  const { error } = await supabase.from("staff_invites").insert({
    business_id: me.data.business_id,
    email,
    role,
    token,
    created_by: me.data.id
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Integrate email later. For now return token so owner can share the link manually.
  return NextResponse.json({ ok: true, token });
}
