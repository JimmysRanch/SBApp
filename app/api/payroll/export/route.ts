import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const staffIdParam = searchParams.get("staff_id");
  const staffId = staffIdParam ? Number(staffIdParam) : NaN;

  if (!staffId || Number.isNaN(staffId)) {
    return NextResponse.json({ error: "staff_id required" }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data: rows, error } = await supabase
    .from("payroll_lines_view")
    .select("*")
    .eq("staff_id", staffId)
    .order("start_time", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const header = [
    "DateTime",
    "Service",
    "Base",
    "CommissionRate",
    "CommissionAmt",
    "Adjustment",
    "Reason",
    "Final",
  ].join(",");

  const lines = (rows ?? []).map((row) => {
    const safeReason = (row.adjustment_reason ?? "").replaceAll('"', '""');
    return [
      row.start_time ? new Date(row.start_time).toISOString() : "",
      `"${row.service ?? ""}"`,
      row.base_price ?? 0,
      row.commission_rate ?? 0,
      row.commission_amount ?? 0,
      row.adjustment_amount ?? 0,
      `"${safeReason}"`,
      row.final_earnings ?? 0,
    ].join(",");
  });

  const csv = [header, ...lines].join("\n");

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv",
      "content-disposition": `attachment; filename=payroll_${staffId}.csv`,
    },
  });
}
