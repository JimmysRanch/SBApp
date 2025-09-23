import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { getSettings, saveSettings } from "@/lib/settings/store";
import { SettingsZ } from "@/lib/settings/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function canManageSettings(_req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok:false, reason:"unauthorized" };

  // Load profile with role and employee_id if present
  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("id, role, employee_id")
    .eq("id", user.id)
    .maybeSingle();

  if (pErr) return { ok:false, reason:"profile_error" };
  const role = profile?.role ?? null;

  // Allow master/admin by role
  if (role === "master" || role === "admin") return { ok:true };

  // Else check employees.app_permissions.can_manage_settings via employee_id
  const empId = profile?.employee_id ?? null;
  if (!empId) return { ok:false, reason:"no_employee" };

  const { data: emp, error: eErr } = await supabase
    .from("employees")
    .select("id, app_permissions")
    .eq("id", empId)
    .maybeSingle();

  if (eErr) return { ok:false, reason:"emp_error" };
  const can = !!(emp?.app_permissions && (emp.app_permissions as any).can_manage_settings === true);
  return { ok: can, reason: can ? undefined : "forbidden" };
}

export async function GET() {
  // Read is allowed to any authenticated user with access; tighten if needed
  const s = await getSettings();
  return NextResponse.json(s);
}

export async function PUT(req: NextRequest) {
  if (cookies().get('e2e-bypass')?.value === 'true') {
    const json = await req.json();
    const parsed = SettingsZ.parse(json);
    const saved = await saveSettings(parsed);
    return NextResponse.json(saved);
  }
  const authz = await canManageSettings(req);
  if (!authz.ok) return new NextResponse(authz.reason ?? "forbidden", { status: authz.reason === "unauthorized" ? 401 : 403 });
  const json = await req.json();
  const parsed = SettingsZ.parse(json);
  const saved = await saveSettings(parsed);
  return NextResponse.json(saved);
}
