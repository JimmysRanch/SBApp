"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { PostgrestError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";
import { useEmployeeDetail } from "../EmployeeDetailClient";
import {
  computeBiweeklyWeekIndex,
  isInvalidInputError,
  isMissingColumnError,
  isMissingPrimaryKeyError,
  isMissingRelationError,
  isPermissionError,
  parseDate,
  readMoney,
  shouldFallbackToAppointments,
  toNumber,
} from "../data-helpers";

type ServicePayrollLine = {
  appointment_id: number;
  start_time: string | null;
  service: string | null;
  base_price: number | null;
  commission_rate: number | null;
  commission_amount: number | null;
  adjustment_amount: number | null;
  adjustment_reason: string | null;
  final_earnings: number | null;
  week_index: number | null;
};

type PaystubPayrollLine = {
  id: number;
  paid_at: string | null;
  base_dollars: number;
  commission_dollars: number;
  override_dollars: number;
  tip_dollars: number;
  guarantee_topup_dollars: number;
  final_dollars: number;
};

type PayrollMode = "service" | "paystub";

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
  const [lineMode, setLineMode] = useState<PayrollMode>("service");
  const [serviceLines, setServiceLines] = useState<ServicePayrollLine[]>([]);
  const [paystubLines, setPaystubLines] = useState<PaystubPayrollLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLines = useCallback(async () => {
    setLoading(true);
    setError(null);
    setServiceLines([]);
    setPaystubLines([]);

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

    const fallbackToPaystubs = async () => {
      try {
        const paystubs = await buildPayrollLinesFromPaystubs(employee.id, startDate, endDate);
        setLineMode("paystub");
        setPaystubLines(paystubs);
        return true;
      } catch (fallbackError) {
        console.warn("Failed to load payroll pay stubs", fallbackError);
        return false;
      }
    };

    try {
      let response = await executeQuery(
        "appointment_id,start_time,service,base_price,base_price_cents,commission_rate,commission_amount,commission_amount_cents,adjustment_amount,adjustment_amount_cents,adjustment_reason,final_earnings,final_earnings_cents,week_index"
      );

      if (
        response.error &&
        (isMissingRelationError(response.error as PostgrestError) ||
          isMissingPrimaryKeyError(response.error as PostgrestError))
      ) {
        const loaded = await fallbackToPaystubs();
        if (loaded) {
          return;
        }
      }

      if (
        response.error &&
        (isMissingColumnError(response.error as PostgrestError) ||
          shouldFallbackToAppointments(response.error as PostgrestError))
      ) {
        const fallback = await buildPayrollLinesFromAppointments(
          employee.id,
          employee.user_id,
          startDate,
          endDate,
          employee.commission_rate
        );
        setLineMode("service");
        setServiceLines(fallback);
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

      setLineMode("service");
      setServiceLines(sanitized as ServicePayrollLine[]);
    } catch (cause) {
      console.error("Failed to load payroll lines", cause);
      setError("Unable to load payroll lines");
      setLineMode("service");
      setServiceLines([]);
      setPaystubLines([]);
    } finally {
      setLoading(false);
    }
  }, [employee.commission_rate, employee.id, employee.user_id, endDate, startDate]);

  useEffect(() => {
    loadLines();
  }, [loadLines, refreshKey]);

  const isPaystubMode = lineMode === "paystub";
  const displayedLines = isPaystubMode ? paystubLines : serviceLines;
  const summaryLabel = isPaystubMode ? "pay stubs" : "paid services";

  const weekTotals = useMemo(() => {
    const totals = [0, 0];
    if (isPaystubMode) {
      paystubLines.forEach((line) => {
        const indexValue = computeBiweeklyWeekIndex(line.paid_at) ?? 1;
        const index = Math.max(0, Math.min(indexValue - 1, 1));
        totals[index] += line.final_dollars ?? 0;
      });
    } else {
      serviceLines.forEach((line) => {
        const index = Math.max(0, Math.min((line.week_index ?? 1) - 1, 1));
        totals[index] += line.final_earnings ?? 0;
      });
    }
    return {
      week1: totals[0],
      week2: totals[1],
      total: totals[0] + totals[1],
    };
  }, [isPaystubMode, paystubLines, serviceLines]);

  const handleExport = () => {
    const params = new URLSearchParams({ staff_id: String(employee.id) });
    if (startDate) params.append("from", startDate);
    if (endDate) params.append("to", endDate);
    if (isPaystubMode) params.append("mode", "paystub");
    window.open(`/api/payroll/export?${params.toString()}`, "_blank");
  };

  const handlePrint = () => {
    window.print();
  };

  const showDiscountColumn = !isPaystubMode && viewerCanManageDiscounts;
  const tableColumnCount = isPaystubMode ? 7 : showDiscountColumn ? 8 : 7;

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
              {displayedLines.length > 0
                ? `${displayedLines.length} ${summaryLabel}`
                : `No ${summaryLabel} in selected period.`}
              {isPaystubMode && (
                <span className="mt-1 block text-xs text-slate-400">
                  Showing payroll pay stubs because detailed appointment lines are unavailable.
                </span>
              )}
            </p>
          </div>
        </header>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              {isPaystubMode ? (
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Paid Date</th>
                  <th className="px-3 py-2">Base</th>
                  <th className="px-3 py-2">Commission</th>
                  <th className="px-3 py-2">Override</th>
                  <th className="px-3 py-2">Tips</th>
                  <th className="px-3 py-2">Guarantee Top-up</th>
                  <th className="px-3 py-2">Final</th>
                </tr>
              ) : (
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Date &amp; Time</th>
                  <th className="px-3 py-2">Service</th>
                  <th className="px-3 py-2">Base</th>
                  <th className="px-3 py-2">Commission</th>
                  <th className="px-3 py-2">Adjustment</th>
                  <th className="px-3 py-2">Final</th>
                  <th className="px-3 py-2">Reason</th>
                  {showDiscountColumn && <th className="px-3 py-2 text-right">Discount</th>}
                </tr>
              )}
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={tableColumnCount} className="px-3 py-8 text-center text-slate-400">
                    Loading payroll…
                  </td>
                </tr>
              )}
              {!loading && displayedLines.length === 0 && (
                <tr>
                  <td colSpan={tableColumnCount} className="px-3 py-8 text-center text-slate-400">
                    No {summaryLabel} in selected period.
                  </td>
                </tr>
              )}
              {!loading && !isPaystubMode &&
                serviceLines.map((line) => {
                  const commissionRate = line.commission_rate ? line.commission_rate * 100 : 0;
                  const adjustment = line.adjustment_amount ?? 0;
                  return (
                    <tr key={`${line.appointment_id}-${line.start_time}`} className="transition hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-600">
                        {line.start_time ? new Date(line.start_time).toLocaleString() : "—"}
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
                      {showDiscountColumn && (
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
              {!loading && isPaystubMode &&
                paystubLines.map((line) => (
                  <tr key={`${line.id}-${line.paid_at}`} className="transition hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-600">
                      {line.paid_at ? new Date(line.paid_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{formatMoney(line.base_dollars ?? 0)}</td>
                    <td className="px-3 py-2 text-slate-600">{formatMoney(line.commission_dollars ?? 0)}</td>
                    <td className="px-3 py-2 text-slate-600">{line.override_dollars ? formatMoney(line.override_dollars) : "—"}</td>
                    <td className="px-3 py-2 text-slate-600">{line.tip_dollars ? formatMoney(line.tip_dollars) : "—"}</td>
                    <td className="px-3 py-2 text-slate-600">
                      {line.guarantee_topup_dollars ? formatMoney(line.guarantee_topup_dollars) : "—"}
                    </td>
                    <td className="px-3 py-2 font-semibold text-brand-navy">{formatMoney(line.final_dollars ?? 0)}</td>
                  </tr>
                ))}
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

async function buildPayrollLinesFromPaystubs(
  employeeId: number,
  startDate: string | null,
  endDate: string | null
): Promise<PaystubPayrollLine[]> {
  let builder = supabase
    .from("payroll_lines_ui")
    .select(
      "id,paid_at,base_dollars,commission_dollars,override_dollars,tip_dollars,guarantee_topup_dollars,final_dollars"
    )
    .eq("employee_id", employeeId)
    .order("paid_at", { ascending: true });

  if (startDate) {
    builder = builder.gte("paid_at", new Date(startDate).toISOString());
  }
  if (endDate) {
    const endBoundary = new Date(endDate);
    endBoundary.setDate(endBoundary.getDate() + 1);
    builder = builder.lt("paid_at", endBoundary.toISOString());
  }

  const response = await builder;

  if (response.error) {
    throw response.error;
  }

  const rows = ((response.data as any[]) ?? []).map((row: any, index: number) => {
    const paidAtValue = row.paid_at;
    const paidAt =
      typeof paidAtValue === "string"
        ? paidAtValue
        : paidAtValue instanceof Date
        ? paidAtValue.toISOString()
        : typeof paidAtValue === "number"
        ? new Date(paidAtValue).toISOString()
        : paidAtValue
        ? String(paidAtValue)
        : null;

    const id = toNumber(row.id) ?? index + 1;

    return {
      id,
      paid_at: paidAt,
      base_dollars: toNumber(row.base_dollars) ?? 0,
      commission_dollars: toNumber(row.commission_dollars) ?? 0,
      override_dollars: toNumber(row.override_dollars) ?? 0,
      tip_dollars: toNumber(row.tip_dollars) ?? 0,
      guarantee_topup_dollars: toNumber(row.guarantee_topup_dollars) ?? 0,
      final_dollars: toNumber(row.final_dollars) ?? 0,
    } as PaystubPayrollLine;
  });

  return rows;
}

async function buildPayrollLinesFromAppointments(
  employeeId: number,
  employeeUserId: string | null | undefined,
  startDate: string | null,
  endDate: string | null,
  commissionRate: number | string | null | undefined
): Promise<ServicePayrollLine[]> {
  const staffIdColumns = [
    "employee_id",
    "staff_id",
    "groomer_id",
    "user_id",
    "assigned_employee_id",
    "assigned_staff_id",
    "team_member_id",
  ];
  const startTimeColumns = [
    "start_time",
    "starts_at",
    "start",
    "starts_on",
    "scheduled_at",
    "scheduled_for",
    "start_date",
    "service_date",
    "appointment_date",
    "date",
  ];
  const selectColumns = [
    "id,start_time,service,price,price_cents,price_amount,price_amount_cents,starts_at,start,starts_on,scheduled_at,scheduled_for,start_date,service_date,appointment_date,date,service_name,service_type,base_price,base_price_cents",
    "*",
  ];

  type StaffCandidate = { value: number | string };

  const staffCandidates: StaffCandidate[] = [];
  const candidateKeys = new Set<string>();
  const pushCandidate = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return;
      const key = `string:${trimmed}`;
      if (candidateKeys.has(key)) return;
      candidateKeys.add(key);
      staffCandidates.push({ value: trimmed });
      return;
    }
    if (!Number.isFinite(value)) return;
    const key = `number:${value}`;
    if (candidateKeys.has(key)) return;
    candidateKeys.add(key);
    staffCandidates.push({ value });
  };

  pushCandidate(employeeId);
  if (Number.isFinite(employeeId)) {
    pushCandidate(String(employeeId));
  }
  const normalisedUserId =
    typeof employeeUserId === "string" && employeeUserId.trim() ? employeeUserId.trim() : null;
  pushCandidate(normalisedUserId);

  const stringCandidateValues = new Set(
    staffCandidates
      .map((candidate) => (typeof candidate.value === "string" ? candidate.value : String(candidate.value)))
      .filter((value) => value.length > 0)
  );
  const numericCandidateValues = new Set(
    staffCandidates
      .map((candidate) =>
        typeof candidate.value === "number"
          ? candidate.value
          : Number.isFinite(Number(candidate.value))
          ? Number(candidate.value)
          : null
      )
      .filter((value): value is number => value !== null)
  );

  let matchedStaffColumn: string | null = null;

  const matchesStaff = (row: Record<string, unknown>) => {
    if (staffCandidates.length === 0) return true;
    const dynamicColumns = new Set<string>([...staffIdColumns, "employee", "staff", "groomer"]);
    if (matchedStaffColumn) {
      dynamicColumns.add(matchedStaffColumn);
      if (!Object.prototype.hasOwnProperty.call(row, matchedStaffColumn)) {
        return true;
      }
    }
    const candidateColumns = Array.from(dynamicColumns);
    return candidateColumns.some((column) => {
      if (!Object.prototype.hasOwnProperty.call(row, column)) return false;
      const raw = row[column as keyof typeof row];
      if (raw === null || raw === undefined) return false;
      if (typeof raw === "number") {
        return numericCandidateValues.has(raw);
      }
      if (typeof raw === "string") {
        const trimmed = raw.trim();
        if (!trimmed) return false;
        if (stringCandidateValues.has(trimmed)) return true;
        const asNumber = Number(trimmed);
        if (Number.isFinite(asNumber)) {
          return numericCandidateValues.has(asNumber);
        }
        return false;
      }
      return false;
    });
  };

  const runAppointmentsQuery = (
    columns: string,
    staffColumn: string,
    staffValue: number | string,
    timeColumn: string | null,
    useBounds: boolean
  ) => {
    let builder = supabase.from("appointments").select(columns).eq(staffColumn, staffValue);
    if (timeColumn) {
      builder = builder.order(timeColumn, { ascending: true });
      if (useBounds) {
        let scoped = builder;
        if (startDate) {
          const value =
            timeColumn.includes("date") && !timeColumn.includes("time")
              ? startDate
              : new Date(startDate).toISOString();
          scoped = scoped.gte(timeColumn, value);
        }
        if (endDate) {
          const endBoundary = new Date(endDate);
          if (!timeColumn.includes("date") || timeColumn.includes("time")) {
            endBoundary.setDate(endBoundary.getDate() + 1);
          }
          const value =
            timeColumn.includes("date") && !timeColumn.includes("time")
              ? endDate
              : endBoundary.toISOString();
          scoped = scoped.lt(timeColumn, value);
        }
        builder = scoped;
      }
    }
    return builder;
  };

  let rows: any[] | null = null;
  let lastError: PostgrestError | null = null;

  outer: for (const staffColumn of staffIdColumns) {
    candidateLoop: for (const candidate of staffCandidates) {
      for (const timeColumn of startTimeColumns) {
        for (const columnSet of selectColumns) {
          const response = await runAppointmentsQuery(
            columnSet,
            staffColumn,
            candidate.value,
            timeColumn,
            true
          );
          if (!response.error) {
            const data = (response.data as any[]) ?? [];
            if (data.length > 0) {
              rows = data;
              lastError = null;
              matchedStaffColumn = staffColumn;
              break outer;
            }
            if (!rows) {
              rows = data;
              lastError = null;
              matchedStaffColumn = staffColumn;
            }
            continue;
          }

          const typedError = response.error as PostgrestError;
          lastError = typedError;

          if (isMissingColumnError(typedError)) {
            continue;
          }
          if (isInvalidInputError(typedError)) {
            continue candidateLoop;
          }
          if (isMissingRelationError(typedError) || isPermissionError(typedError)) {
            throw typedError;
          }
          throw typedError;
        }
      }
    }
  }

  if (!rows || rows.length === 0) {
    outerNoBounds: for (const staffColumn of staffIdColumns) {
      candidateLoopNoBounds: for (const candidate of staffCandidates) {
        for (const columnSet of selectColumns) {
          const response = await runAppointmentsQuery(
            columnSet,
            staffColumn,
            candidate.value,
            null,
            false
          );
          if (!response.error) {
            const data = (response.data as any[]) ?? [];
            if (data.length > 0) {
              rows = data;
              lastError = null;
              matchedStaffColumn = staffColumn;
              break outerNoBounds;
            }
            if (!rows) {
              rows = data;
              lastError = null;
              matchedStaffColumn = staffColumn;
            }
            continue;
          }

          const typedError = response.error as PostgrestError;
          lastError = typedError;

          if (isMissingColumnError(typedError)) {
            continue;
          }
          if (isInvalidInputError(typedError)) {
            continue candidateLoopNoBounds;
          }
          if (isMissingRelationError(typedError) || isPermissionError(typedError)) {
            throw typedError;
          }
          throw typedError;
        }
      }
      if (rows && rows.length > 0) {
        break;
      }
    }
  }

  if ((!rows || rows.length === 0) && staffCandidates.length > 0) {
    matchedStaffColumn = null;
    for (const columnSet of selectColumns) {
      const probe = await supabase
        .from("appointments")
        .select(columnSet)
        .limit(1000);
      if (!probe.error) {
        const data = ((probe.data as any[]) ?? []).filter((row) => matchesStaff(row));
        if (data.length > 0) {
          rows = data;
          lastError = null;
          matchedStaffColumn = null;
          break;
        }
        if (!rows) {
          rows = data;
          matchedStaffColumn = null;
        }
        continue;
      }

      const typedError = probe.error as PostgrestError;
      lastError = typedError;
      if (!isMissingColumnError(typedError)) {
        break;
      }
    }
  }

  if (!rows) {
    if (lastError) {
      throw lastError;
    }
    return [];
  }

  const startBoundary = startDate ? new Date(startDate) : null;
  const endBoundary = endDate ? new Date(endDate) : null;
  if (endBoundary) {
    endBoundary.setDate(endBoundary.getDate() + 1);
  }

  const filteredRows = rows.filter((row) => {
    if (!matchesStaff(row)) {
      return false;
    }

    const value =
      row.start_time ??
      row.starts_at ??
      row.start ??
      row.starts_on ??
      row.scheduled_at ??
      row.scheduled_for ??
      row.start_date ??
      row.service_date ??
      row.appointment_date ??
      row.date ??
      null;

    let date: Date | null = null;
    if (value instanceof Date) {
      date = value;
    } else if (typeof value === "number") {
      const parsed = new Date(value);
      date = Number.isNaN(parsed.getTime()) ? null : parsed;
    } else if (typeof value === "string") {
      date = parseDate(value);
    }

    if (!date) return true;
    if (startBoundary && date < startBoundary) return false;
    if (endBoundary && date >= endBoundary) return false;
    return true;
  });

  const appointmentIds = filteredRows
    .map((row) => row.id)
    .filter((id) => typeof id === "number");

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

  return filteredRows.map((row) => {
    const id = row.id as number;
    const base =
      readMoney(row, [
        "price",
        "price_cents",
        "price_amount",
        "price_amount_cents",
        "base_price",
        "base_price_cents",
        "amount",
        "amount_cents",
      ]) ?? 0;
    const discountInfo = discountMap.get(id);
    const adjustmentAmount = discountInfo ? -discountInfo.total : 0;
    const adjustmentReason = discountInfo && discountInfo.reasons.length > 0 ? discountInfo.reasons.join("; ") : null;
    const commissionAmount = base * rate;
    const final = base + commissionAmount + adjustmentAmount;

    const startValue =
      row.start_time ??
      row.starts_at ??
      row.start ??
      row.starts_on ??
      row.scheduled_at ??
      row.scheduled_for ??
      row.start_date ??
      row.service_date ??
      row.appointment_date ??
      row.date ??
      null;
    const startTime =
      typeof startValue === "string"
        ? startValue
        : startValue instanceof Date
        ? startValue.toISOString()
        : typeof startValue === "number"
        ? new Date(startValue).toISOString()
        : startValue
        ? String(startValue)
        : null;

    const serviceName =
      row.service ?? row.service_name ?? row.service_type ?? row.title ?? row.service_label ?? null;

    return {
      appointment_id: id,
      start_time: startTime,
      service: serviceName,
      base_price: base,
      commission_rate: rate,
      commission_amount: commissionAmount,
      adjustment_amount: adjustmentAmount,
      adjustment_reason: adjustmentReason,
      final_earnings: final,
      week_index: computeBiweeklyWeekIndex(startTime),
    } as ServicePayrollLine;
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
