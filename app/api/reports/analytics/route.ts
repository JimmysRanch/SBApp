import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(req.url);
  
  // Authentication
  const { data: me } = await supabase.auth.getUser();
  const uid = me.user?.id;
  if (!uid) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  
  // Get user's business_id for proper scoping
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", uid)
    .single();

  if (profileError || !profile?.business_id) {
    return NextResponse.json({ error: 'Business access required' }, { status: 403 });
  }

  // Check permissions
  const { data: canViewReports } = await supabase.rpc('has_perm', { _uid: uid, _perm: 'can_view_reports' });
  if (!canViewReports) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  // Parse parameters
  const startDate = searchParams.get("start_date") || undefined;
  const endDate = searchParams.get("end_date") || undefined;
  const staffId = searchParams.get("staff_id") || undefined;
  const statusFilter = searchParams.get("status") || null;
  const reportType = searchParams.get("type") || "summary";

  try {
    switch (reportType) {
      case "appointments":
        const { data: appointmentMetrics, error: appointmentError } = await supabase.rpc(
          'reports_appointment_metrics_enhanced',
          {
            business_id: profile.business_id,
            start_date: startDate,
            end_date: endDate,
            staff_id: staffId,
            status_filter: statusFilter
          }
        );
        
        if (appointmentError) throw appointmentError;
        return NextResponse.json({ data: appointmentMetrics });

      case "staff":
        const page = Number(searchParams.get("page") || "1");
        const size = Math.min(Number(searchParams.get("size") || "10"), 50);
        const offset = (page - 1) * size;

        const { data: staffMetrics, error: staffError } = await supabase.rpc(
          'reports_staff_performance',
          {
            business_id: profile.business_id,
            start_date: startDate,
            end_date: endDate,
            limit_count: size,
            offset_count: offset
          }
        );
        
        if (staffError) throw staffError;
        
        // Get total count for pagination
        const { count: totalStaff } = await supabase
          .from("employees")
          .select("*", { count: 'exact', head: true })
          .eq("business_id", profile.business_id);

        return NextResponse.json({
          data: staffMetrics,
          pagination: {
            page,
            size,
            total: totalStaff || 0,
            totalPages: Math.ceil((totalStaff || 0) / size),
            hasNext: (totalStaff || 0) > offset + size,
            hasPrev: page > 1
          }
        });

      case "summary":
      default:
        const { data: businessSummary, error: summaryError } = await supabase.rpc(
          'reports_business_summary',
          {
            business_id: profile.business_id,
            start_date: startDate,
            end_date: endDate
          }
        );
        
        if (summaryError) throw summaryError;
        return NextResponse.json({ data: businessSummary });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed to load analytics" }, { status: 500 });
  }
}