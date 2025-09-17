import { NextRequest, NextResponse } from "next/server";
import { listEvents, createEvent } from "@/lib/supabase/calendar";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const staffId = searchParams.get("staffId") ?? undefined;
  const type = searchParams.get("type") ?? undefined;
  try {
    const data = await listEvents({ from, to, staffId, type });
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
