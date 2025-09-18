import { NextRequest, NextResponse } from "next/server";
import { listEvents, createEvent } from "@/lib/supabase/calendar";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const staffIdParam = searchParams.get("staffId");
  const staffId = staffIdParam && staffIdParam.trim() !== ""
    ? staffIdParam
    : undefined;
  const type = searchParams.get("type") ?? undefined;
  try {
    const params: { from?: string; to?: string; staffId?: string; type?: string } = { from, to, type };
    if (staffId !== undefined) params.staffId = staffId;
    const data = await listEvents(params);
    return NextResponse.json({ data });
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
