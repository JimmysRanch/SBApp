import { NextRequest, NextResponse } from "next/server";
import { calendarUsesMockData, getEvent, updateEvent, deleteEvent } from "@/lib/supabase/calendar";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await getEvent(params.id);
    return NextResponse.json({ data, meta: { usingMockData: calendarUsesMockData() } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Not found" }, { status: 404 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const json = await req.json();
    const data = await updateEvent(params.id, json);
    return NextResponse.json({ data, meta: { usingMockData: calendarUsesMockData() } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed to update" }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await deleteEvent(params.id);
    return NextResponse.json({ ok: true, meta: { usingMockData: calendarUsesMockData() } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed to delete" }, { status: 400 });
  }
}
