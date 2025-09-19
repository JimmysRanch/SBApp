"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { PostgrestError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";
import { useEmployeeDetail } from "../EmployeeDetailClient";
import {
  computeBiweeklyWeekIndex,
  isMissingColumnError,
  isMissingRelationError,
  isPermissionError,
  readMoney,
  shouldFallbackToAppointments,
  toNumber,
} from "../data-helpers";

type PayrollLine = {
  appointment_id: number;
  start_time: string;
  service: string | null;
  base_price: number | null;
  commission_rate: number | null;
  commission_amount: number | null;
  adjustment_amount: number | null;
  adjustment_reason: string | null;
  final_earnings: number | null;
  week_index: number | null;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function defaultPeriod() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 13);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default function EmployeePayrollPage() {
  const { employee, viewerCanManageDiscounts, openDiscountModal, refreshKey } = useEmployeeDetail();

  const { start, end } = useMemo(() => defaultPeriod(), []);
  const [startDate, setStartDate] = useState(start);
  const [endDate, setEndDate] = useState(end);
  const [lines, setLines] = useState<PayrollLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLines = useCallback(async () => {
    setLoading(true);
    setError(null);

    const executeQuery = (columns: string) => {
      let builder = supabase
        .from("payroll_lines_view")
        .select(columns)
        .eq("staff_id", employee.id)
        .order("start_time", { ascending: true });

      if (startDate) {
        builder = builder.gte("start_time", new Date(startDate).toISOString());
      }
      if (endDate) {
        const endBoundary = new Date(endDate);
        endBoundary.setDate(endBoundary.getDate() + 1);
        builder = builder.lt("start_time", endBoundary.toISOString());
      }

      return builder;
    };

    try {
      let response = await executeQuery(
        "appointment_id,start_time,service,base_price,base_price_cents,commission_rate,commission_amount,commission_amount_cents,adjustment_amount,adjustment_amount_cents,adjustment_reason,final_earnings,final_earnings_cents,week_index"
      );

      if (
        response.error &&
        (isMissingColumnError(response.error as PostgrestError) || shouldFallbackToAppointments(response.error as PostgrestError))
      ) {
        const fallback = await buildPayrollLinesFromAppointments(
          employee.id,
          startDate,
          endDate,
          employee.commission_rate
        );
        setLines(fallback);
        return;
      }

      if (response.error) {
        throw response.error;
      }

      const sanitized = ((response.data as any[]) ?? []).map((line: any) => ({
        appointment_id: line.appointment_id,
        start_time: line.start_time,
        service: line.service,
        base_price: readMoney(line, ["base_price", "base_price_cents"]) ?? 0,
        commission_rate: toNumber(line.commission_rate) ?? 0,
        commission_amount: readMoney(line, ["commission_amount", "commission_amount_cents"]) ?? 0,
        adjustment_amount: readMoney(line, ["adjustment_amount", "adjustment_amount_cents"]) ?? 0,
        adjustment_reason: line.adjustment_reason ?? null,
        final_earnings: readMoney(line, ["final_earnings", "final_earnings_cents"]) ?? 0,
        week_index: toNumber(line.week_index),
      }));

      setLines(sanitized as PayrollLine[]);
    } catch (cause) {
      console.error("Failed to load payroll lines", cause);
      setError("Unable to load payroll lines");
      setLines([]);
    } finally {
      setLoading(false);
    }
  }, [employee.commission_rate, employee.id, endDate, startDate]);

  useEffect(() => {
    loadLines();
  }, [loadLines, refreshKey]);

  const weekTotals = useMemo(() => {
    const totals = [0, 0];
    lines.forEach((line) => {
      const index = Math.max(0, Math.min((line.week_index ?? 1) - 1, 1));
      totals[index] += line.final_earnings ?? 0;
    });
    return {
      week1: totals[0],
      week2: totals[1],
      total: totals[0] + totals[1],
    };
  }, [lines]);

  const handleExport = () => {
    const params = new URLSearchParams({ staff_id: String(employee.id) });
    if (startDate) params.append("from", startDate);
    if (endDate) params.append("to", endDate);
    window.open(`/api/payroll/export?${params.toString()}`, "_blank");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={loadLines}
            className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-blue/90"
          >
            Refresh
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-brand-blue hover:bg-slate-100"
            >
              Download CSV
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-brand-blue hover:bg-slate-100"
            >
              Print Paycheck
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-brand-navy">Pay period details</h2>
            <p className="text-sm text-slate-500">
              {lines.length > 0
                ? `${lines.length} paid services`
                : "No paid services in selected period."}
            </p>
          </div>
        </header>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">Date & Time</th>
                <th className="px-3 py-2">Service</th>
                <th className="px-3 py-2">Base</th>
                <th className="px-3 py-2">Commission</th>
                <th className="px-3 py-2">Adjustment</th>
                <th className="px-3 py-2">Final</th>
                <th className="px-3 py-2">Reason</th>
                {viewerCanManageDiscounts && <th className="px-3 py-2 text-right">Discount</th>}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={viewerCanManageDiscounts ? 8 : 7} className="px-3 py-8 text-center text-slate-400">
                    Loading payroll…
                  </td>
                </tr>
              )}
              {!loading && lines.length === 0 && (
                <tr>
                  <td colSpan={viewerCanManageDiscounts ? 8 : 7} className="px-3 py-8 text-center text-slate-400">
                    No paid services in selected period.
                  </td>
                </tr>
              )}
              {!loading &&
                lines.map((line) => {
                  const commissionRate = line.commission_rate ? line.commission_rate * 100 : 0;
                  const adjustment = line.adjustment_amount ?? 0;
                  return (
                    <tr key={`${line.appointment_id}-${line.start_time}`} className="transition hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-600">
                        {new Date(line.start_time).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-slate-600">{line.service ?? "—"}</td>
                      <td className="px-3 py-2 text-slate-600">{formatMoney(line.base_price ?? 0)}</td>
                      <td className="px-3 py-2 text-slate-600">
                        {commissionRate ? `${commissionRate.toFixed(0)}% → ${formatMoney(line.commission_amount ?? 0)}` : "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {adjustment ? formatMoney(adjustment) : "—"}
                      </td>
                      <td className="px-3 py-2 font-semibold text-brand-navy">{formatMoney(line.final_earnings ?? 0)}</td>
                      <td className="px-3 py-2 text-slate-500">{line.adjustment_reason ?? "—"}</td>
                      {viewerCanManageDiscounts && (
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              openDiscountModal({
                                appointmentId: line.appointment_id,
                                amount: Math.abs(adjustment),
                                reason: line.adjustment_reason ?? "",
                              })
                            }
                            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-brand-blue hover:bg-slate-100"
                          >
                            {adjustment ? "Edit discount" : "Add discount"}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
            </tbody>
          </table>
          {error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">{error}</div>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <TotalCard label="Week 1 Total" value={formatMoney(weekTotals.week1)} />
        <TotalCard label="Week 2 Total" value={formatMoney(weekTotals.week2)} />
        <TotalCard label="Pay-period Total" value={formatMoney(weekTotals.total)} />
      </section>
    </div>
  );
}

async function buildPayrollLinesFromAppointments(
  employeeId: number,
  startDate: string | null,
  endDate: string | null,
  commissionRate: number | string | null | undefined
): Promise<PayrollLine[]> {
  const runAppointmentsQuery = (columns: string) => {
    let builder = supabase
      .from("appointments")
      .select(columns)
      .eq("employee_id", employeeId)
      .order("start_time", { ascending: true });

    if (startDate) {
      builder = builder.gte("start_time", new Date(startDate).toISOString());
    }
    if (endDate) {
      const endBoundary = new Date(endDate);
      endBoundary.setDate(endBoundary.getDate() + 1);
      builder = builder.lt("start_time", endBoundary.toISOString());
    }

    return builder;
  };

  let appointmentResponse = await runAppointmentsQuery(
    "id,start_time,service,price,price_cents,price_amount,price_amount_cents"
  );

  if (
    appointmentResponse.error &&
    isMissingColumnError(appointmentResponse.error as PostgrestError)
  ) {
    appointmentResponse = await runAppointmentsQuery("*");
  }

  if (appointmentResponse.error) {
    throw appointmentResponse.error;
  }

  const rows = (appointmentResponse.data as any[]) ?? [];
  const appointmentIds = rows.map((row) => row.id).filter((id) => typeof id === "number");

  const discountMap = new Map<
    number,
    { total: number; reasons: string[] }
  >();

  if (appointmentIds.length > 0) {
    const runDiscountQuery = (columns: string) =>
      supabase
        .from("appointment_discounts")
        .select(columns)
        .in("appointment_id", appointmentIds);

    let discountResponse = await runDiscountQuery("appointment_id,amount,amount_cents,reason");

    if (
      discountResponse.error &&
      isMissingColumnError(discountResponse.error as PostgrestError)
    ) {
      discountResponse = await runDiscountQuery("appointment_id,amount,reason");
    }

    if (discountResponse.error) {
      if (
        !isMissingRelationError(discountResponse.error as PostgrestError) &&
        !isPermissionError(discountResponse.error as PostgrestError)
      ) {
        throw discountResponse.error;
      }
    } else {
      (discountResponse.data as any[])?.forEach((item: any) => {
        const id = item.appointment_id;
        if (typeof id !== "number") return;
        const amount = readMoney(item, ["amount", "amount_cents"]) ?? 0;
        const reason = typeof item.reason === "string" && item.reason.trim() ? item.reason.trim() : null;
        const entry = discountMap.get(id) ?? { total: 0, reasons: [] };
        entry.total += amount;
        if (reason) {
          entry.reasons.push(reason);
        }
        discountMap.set(id, entry);
      });
    }
  }

  const rate = toNumber(commissionRate) ?? 0;

  return rows.map((row) => {
    const id = row.id as number;
    const base = readMoney(row, ["price", "price_cents", "price_amount", "price_amount_cents"]) ?? 0;
    const discountInfo = discountMap.get(id);
    const adjustmentAmount = discountInfo ? -discountInfo.total : 0;
    const adjustmentReason = discountInfo && discountInfo.reasons.length > 0 ? discountInfo.reasons.join("; ") : null;
    const commissionAmount = base * rate;
    const final = base + commissionAmount + adjustmentAmount;

    return {
      appointment_id: id,
      start_time: row.start_time,
      service: row.service ?? null,
      base_price: base,
      commission_rate: rate,
      commission_amount: commissionAmount,
      adjustment_amount: adjustmentAmount,
      adjustment_reason: adjustmentReason,
      final_earnings: final,
      week_index: computeBiweeklyWeekIndex(row.start_time),
    } as PayrollLine;
  });
}

type TotalCardProps = {
  label: string;
  value: string;
};

function TotalCard({ label, value }: TotalCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-brand-navy">{value}</div>
    </div>
  );
}
