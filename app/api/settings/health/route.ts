import { NextResponse } from "next/server";
import { getSettings, getSettingsMeta } from "@/lib/settings/store";

export async function GET(){
  try {
    if (getSettingsMeta().lastReadSource === "unknown") {
      await getSettings();
    }
    const meta = getSettingsMeta();
    return NextResponse.json({
      mode: meta.lastReadSource,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      lastReadSource: meta.lastReadSource,
      lastPersistTarget: meta.lastPersistTarget,
      readErrors: meta.readErrors,
      writeError: meta.writeError ?? null,
    });
  } catch (e: any) {
    return new NextResponse(`HEALTH /api/settings failed: ${String(e?.message || e)}`, {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
