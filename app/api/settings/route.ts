import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { getSettings, saveSettings } from "@/lib/settings/store";

function hasBypass(): boolean {
  const cookieStore = cookies();
  return process.env.E2E_BYPASS_AUTH === "true" || cookieStore.get("e2e-bypass")?.value === "true";
}

async function getAuthContext() {
  const supabase = createRouteHandlerClient({ cookies });
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw new Error(`auth_get_user: ${error.message}`);
  }
  return { supabase, user: data.user };
}

async function ensureAuthenticated(): Promise<{ ok: boolean; status?: number; reason?: string }> {
  if (hasBypass()) return { ok: true };
  const { user } = await getAuthContext();
  if (!user) return { ok: false, status: 401, reason: "unauthorized" };
  return { ok: true };
}

async function canManageSettings() {
  if (hasBypass()) return { ok: true } as const;
  const { supabase, user } = await getAuthContext();
  if (!user) {
    return { ok: false, status: 401, reason: "unauthorized" } as const;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, employee_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { ok: false, status: 500, reason: `profile_error: ${profileError.message}` } as const;
  }

  if (profile?.role === "master" || profile?.role === "admin") {
    return { ok: true } as const;
  }

  if (!profile?.employee_id) {
    return { ok: false, status: 403, reason: "no_employee" } as const;
  }

  const { data: emp, error: employeeError } = await supabase
    .from("employees")
    .select("app_permissions")
    .eq("id", profile.employee_id)
    .maybeSingle();

  if (employeeError) {
    return { ok: false, status: 500, reason: `employee_error: ${employeeError.message}` } as const;
  }

  const canManage = !!(emp?.app_permissions && (emp.app_permissions as any).can_manage_settings === true);
  if (!canManage) {
    return { ok: false, status: 403, reason: "forbidden" } as const;
  }

  return { ok: true } as const;
}

export async function GET() {
  try {
    const auth = await ensureAuthenticated();
    if (!auth.ok) {
      return new NextResponse(auth.reason ?? "unauthorized", {
        status: auth.status ?? 401,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (e: any) {
    return new NextResponse(`GET /api/settings failed: ${String(e?.message || e)}`, {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authz = await canManageSettings();
    if (!authz.ok) {
      return new NextResponse(authz.reason ?? "forbidden", {
        status: authz.status ?? 403,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const body = await req.json();
    const saved = await saveSettings(body);
    return NextResponse.json(saved);
  } catch (e: any) {
    return new NextResponse(`PUT /api/settings failed: ${String(e?.message || e)}`, {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
