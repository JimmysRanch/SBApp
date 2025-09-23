import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings/store";

export async function GET() {
  try {
    const data = await getSettings();
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return new NextResponse(
      `DEBUG getSettings failed: ${String(e?.message || e)}`,
      { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }
}
