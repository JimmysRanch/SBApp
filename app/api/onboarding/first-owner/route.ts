export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const businessName = typeof body?.businessName === "string" && body.businessName.trim().length
    ? body.businessName.trim()
    : "My Grooming Business";

  const { data, error } = await supabase.rpc("claim_first_owner", {
    p_user: session.user.id,
    p_business_name: businessName
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, businessId: data });
}
