import { NextRequest, NextResponse } from "next/server";
import { listEvents, createEvent } from "@/lib/supabase/calendar";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(req.url);
  
  // Get authenticated user's business_id for proper scoping
  const { data: me } = await supabase.auth.getUser();
  if (!me.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user's business_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", me.user.id)
    .single();

  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const staffIdParam = searchParams.get("staffId");
  const staffId = staffIdParam && staffIdParam.trim() !== ""
    ? staffIdParam
    : undefined;
  const type = searchParams.get("type") ?? undefined;
  const page = Number(searchParams.get("page") || "1");
  const size = Number(searchParams.get("size") || "50");
  
  try {
    const params: { from?: string; to?: string; staffId?: string; type?: string; page: number; size: number; businessId?: string } = { from, to, type, page, size };
    if (staffId !== undefined) params.staffId = staffId;
    if (profile?.business_id) params.businessId = profile.business_id;
    
    const result = await listEvents(params);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed to list events" }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const data = await createEvent(json);
    return NextResponse.json({ data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed to create" }, { status: 400 });
  }
}
