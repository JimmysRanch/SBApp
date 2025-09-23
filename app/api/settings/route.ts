import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/settings/store";

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (e: any) {
    return new NextResponse(`GET /api/settings failed: ${String(e?.message || e)}`, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const saved = await saveSettings(body);
    return NextResponse.json(saved);
  } catch (e: any) {
    return new NextResponse(`PUT /api/settings failed: ${String(e?.message || e)}`, { status: 500 });
  }
}
