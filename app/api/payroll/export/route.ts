import { NextResponse } from "next/server";

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import {
  isMissingPrimaryKeyError,
  isMissingRelationError,
  toNumber,
} from "@/app/employees/[id]/data-helpers";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const staffId = url.searchParams.get("staff_id");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const mode = url.searchParams.get("mode");

  if (!staffId) {
    return NextResponse.json({ error: "staff_id is required" }, { status: 400 });
  }

  const supabase = createClient();
  const staffIdNumber = Number(staffId);
  if (!Number.isFinite(staffIdNumber)) {
    return NextResponse.json({ error: "staff_id must be a number" }, { status: 400 });
  }

  if (mode === "paystub") {
    return exportPaystubCsv(supabase, staffIdNumber, from, to);
  }

  let query = supabase
    .from("payroll_lines_view")
    .select(
      "start_time,service,base_price,base_price_cents,commission_rate,commission_amount,commission_amount_cents,adjustment_amount,adjustment_amount_cents,adjustment_reason,final_earnings,final_earnings_cents,week_index"
    )
    .eq("staff_id", staffIdNumber)
    .order("start_time", { ascending: true });

  if (from) {
    query = query.gte("start_time", new Date(from).toISOString());
  }
  if (to) {
    const end = new Date(to);
    end.setDate(end.getDate() + 1);
    query = query.lt("start_time", end.toISOString());
  }

  const { data, error } = await query;
  if (error) {
    const typedError = error as PostgrestError;
    if (isMissingRelationError(typedError) || isMissingPrimaryKeyError(typedError)) {
      return exportPaystubCsv(supabase, staffIdNumber, from, to);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []).map((line: any) => {
    const base = typeof line.base_price === "number" ? line.base_price : line.base_price_cents ? line.base_price_cents / 100 : 0;
    const commissionAmount =
      typeof line.commission_amount === "number"
        ? line.commission_amount
        : line.commission_amount_cents
        ? line.commission_amount_cents / 100
        : 0;
    const adjustment =
      typeof line.adjustment_amount === "number"
        ? line.adjustment_amount
        : line.adjustment_amount_cents
        ? line.adjustment_amount_cents / 100
        : 0;
    const final =
      typeof line.final_earnings === "number"
        ? line.final_earnings
        : line.final_earnings_cents
        ? line.final_earnings_cents / 100
        : 0;
    const rate = typeof line.commission_rate === "number" ? line.commission_rate : Number(line.commission_rate ?? 0);
    return {
      date: line.start_time,
      service: line.service ?? "",
      base,
      commissionRate: rate,
      commissionAmount,
      adjustment,
      reason: line.adjustment_reason ?? "",
      final,
      week: line.week_index ?? "",
    };
  });

  const header = [
    "Date",
    "Service",
    "Base",
    "Commission Rate",
    "Commission Amount",
    "Adjustment",
    "Reason",
    "Final",
    "Week",
  ];

  const csv = [
    header.join(","),
    ...rows.map((row) =>
      [
        new Date(row.date).toLocaleString().replace(/,/g, ""),
        escapeCsv(row.service),
        row.base.toFixed(2),
        (row.commissionRate * 100).toFixed(2),
        row.commissionAmount.toFixed(2),
        row.adjustment.toFixed(2),
        escapeCsv(row.reason),
        row.final.toFixed(2),
        row.week,
      ].join(",")
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=staff-${staffId}-payroll.csv`,
    },
  });
}

async function exportPaystubCsv(
  supabase: SupabaseClient,
  staffId: number,
  from: string | null,
  to: string | null
) {
  let query = supabase
    .from("payroll_lines_ui")
    .select(
      "paid_at,base_dollars,commission_dollars,override_dollars,tip_dollars,guarantee_topup_dollars,final_dollars"
    )
    .eq("employee_id", staffId)
    .order("paid_at", { ascending: true });

  if (from) {
    query = query.gte("paid_at", new Date(from).toISOString());
  }
  if (to) {
    const end = new Date(to);
    end.setDate(end.getDate() + 1);
    query = query.lt("paid_at", end.toISOString());
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = ((data ?? []) as any[]).map((line) => ({
    paid_at: line.paid_at ?? null,
    base: toNumber(line.base_dollars) ?? 0,
    commission: toNumber(line.commission_dollars) ?? 0,
    override: toNumber(line.override_dollars) ?? 0,
    tips: toNumber(line.tip_dollars) ?? 0,
    guarantee: toNumber(line.guarantee_topup_dollars) ?? 0,
    final: toNumber(line.final_dollars) ?? 0,
  }));

  const header = [
    "Paid Date",
    "Base",
    "Commission",
    "Override",
    "Tips",
    "Guarantee Top-up",
    "Final",
  ];

  const csv = [
    header.join(","),
    ...rows.map((row) =>
      [
        formatPaystubDate(row.paid_at),
        row.base.toFixed(2),
        row.commission.toFixed(2),
        row.override.toFixed(2),
        row.tips.toFixed(2),
        row.guarantee.toFixed(2),
        row.final.toFixed(2),
      ].join(",")
    ),
  ].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=staff-${staffId}-payroll.csv`,
    },
  });
}

function formatPaystubDate(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleDateString().replace(/,/g, "");
}

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes("\"")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
