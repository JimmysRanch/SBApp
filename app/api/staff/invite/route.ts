import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { z } from "zod";

import { getSupabaseAdmin } from "@/lib/supabase/server";

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(["manager", "front_desk", "groomer"]),
  expiresInHours: z.number().int().positive().max(24 * 14).optional(),
});

function generateToken() {
  return randomBytes(24).toString("base64url");
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, business_id")
    .eq("id", session.user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (!profile || profile.role !== "master") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (!profile.business_id) {
    return NextResponse.json({ error: "missing_business" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = inviteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_invite", details: parsed.error.flatten() }, { status: 400 });
  }

  const { email, role, expiresInHours } = parsed.data;
  const token = generateToken();
  const expiresAt = expiresInHours ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000) : null;

  const admin = getSupabaseAdmin();

  const { data: existing, error: existingError } = await admin
    .from("staff_invitations")
    .select("id")
    .eq("business_id", profile.business_id)
    .eq("email", email)
    .is("accepted_at", null)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const payload = {
    business_id: profile.business_id,
    email,
    role,
    token,
    invited_by: session.user.id,
    expires_at: expiresAt ? expiresAt.toISOString() : null,
    accepted_at: null,
    accepted_by: null,
  };

  const mutation = existing
    ? admin.from("staff_invitations").update(payload).eq("id", existing.id)
    : admin.from("staff_invitations").insert(payload);

  const { error: mutationError, data: mutationData } = await mutation
    .select("id, token, email, role, expires_at")
    .maybeSingle();

  if (mutationError) {
    return NextResponse.json({ error: mutationError.message }, { status: 500 });
  }

  return NextResponse.json({
    id: mutationData?.id,
    token,
    email,
    role,
    expiresAt: expiresAt?.toISOString() ?? null,
  });
}
