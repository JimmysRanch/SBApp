import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getSupabaseAdmin();
  const uid = session.user.id;

  // Demote any existing master except me
  const demote = await admin
    .from("profiles")
    .update({ role: "senior_groomer" })
    .eq("role", "master")
    .neq("id", uid);
  if (demote.error) return NextResponse.json({ error: demote.error.message }, { status: 400 });

  // Ensure my profile exists & is marked as master
  const upsertProfile = await admin
    .from("profiles")
    .upsert({ id: uid, full_name: session.user.email ?? "Owner", role: "master" }, { onConflict: "id" });
  if (upsertProfile.error) return NextResponse.json({ error: upsertProfile.error.message }, { status: 400 });

  // Ensure employees row with dashboard access
  const upsertEmp = await admin
    .from("employees")
    .upsert(
      { user_id: uid, name: "Owner", active: true, app_permissions: { dashboard: true } },
      { onConflict: "user_id" }
    );
  if (upsertEmp.error) return NextResponse.json({ error: upsertEmp.error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
