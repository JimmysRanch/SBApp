import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { getSettings, saveSettings } from "@/lib/settings/store";

async function canManageSettings() {
  const cookieStore = cookies();
  if (process.env.E2E_BYPASS_AUTH === "true" || cookieStore.get("e2e-bypass")?.value === "true") return true;
  const supabase = createRouteHandlerClient({ cookies });
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, employee_id")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role === "master" || profile?.role === "admin") return true;
  if (!profile?.employee_id) return false;
  const { data: emp } = await supabase
    .from("employees")
    .select("app_permissions")
    .eq("id", profile.employee_id)
    .maybeSingle();
  return !!(emp?.app_permissions && (emp.app_permissions as any).can_manage_settings === true);
}

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (e: any) {
    return new NextResponse(`GET /api/settings failed: ${String(e?.message||e)}`, { status: 500, headers:{"Content-Type":"text/plain"} });
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!(await canManageSettings())) return new NextResponse("forbidden", { status: 403 });
    const body = await req.json();
    const saved = await saveSettings(body);
    return NextResponse.json(saved);
  } catch (e: any) {
    return new NextResponse(`PUT /api/settings failed: ${String(e?.message||e)}`, { status: 500, headers:{"Content-Type":"text/plain"} });
  }
}
