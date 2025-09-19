"use client";

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";

import type { PostgrestError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";
import { useEmployeeDetail } from "../EmployeeDetailClient";
import { isMissingColumnError, readMoney } from "../data-helpers";

type HistoryRow = {
  id: number;
  start_time: string;
  service: string | null;
  status: string | null;
  price: number;
  tip: number;
  pet_name: string | null;
};

type Filters = {
  startDate: string;
  endDate: string;
  status: string;
  services: string[];
};

const defaultFilters: Filters = {
  startDate: "",
  endDate: "",
  status: "all",
  services: [],
};

const STATUS_OPTIONS = ["all", "scheduled", "completed", "cancelled", "no-show", "in progress"];

export default function EmployeeHistoryPage() {
  const { employee, openAppointmentDrawer, refreshKey } = useEmployeeDetail();

  const [serviceOptions, setServiceOptions] = useState<string[]>([]);
  const [formFilters, setFormFilters] = useState<Filters>(defaultFilters);
  const [activeFilters, setActiveFilters] = useState<Filters>(defaultFilters);
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchServices = async () => {
      const { data, error: serviceError } = await supabase
        .from("appointments")
        .select("service")
        .eq("employee_id", employee.id)
        .not("service", "is", null)
        .order("service", { ascending: true });
      if (!isMounted) return;
      if (!serviceError && Array.isArray(data)) {
        const values = Array.from(
          new Set(
            data
              .map((item) => (typeof item.service === "string" ? item.service : null))
              .filter(Boolean) as string[]
          )
        );
        setServiceOptions(values);
      }
    };
    fetchServices();
    return () => {
      isMounted = false;
    };
  }, [employee.id]);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError(null);

    const executeQuery = (columns: string) => {
      let builder = supabase
        .from("appointments")
        .select(columns)
        .eq("employee_id", employee.id)
        .order("start_time", { ascending: false });

      if (activeFilters.startDate) {
        builder = builder.gte("start_time", new Date(activeFilters.startDate).toISOString());
      }
      if (activeFilters.endDate) {
        const end = new Date(activeFilters.endDate);
        end.setDate(end.getDate() + 1);
        builder = builder.lt("start_time", end.toISOString());
      }
      if (activeFilters.status && activeFilters.status !== "all") {
        builder = builder.eq("status", activeFilters.status);
      }
      if (activeFilters.services.length > 0) {
        builder = builder.in("service", activeFilters.services);
      }

      return builder;
    };

    try {
      let response = await executeQuery(
        "id,start_time,end_time,service,status,price,price_cents,price_amount,price_amount_cents,tip,tip_amount,tip_cents,tip_amount_cents,pet_name"
      );
      if (response.error && isMissingColumnError(response.error as PostgrestError)) {
        response = await executeQuery("*");
      }

      if (response.error) {
        throw response.error;
      }

      const mapped = ((response.data as any[]) ?? []).map((item: any) => {
        const price = readMoney(item, [
          "price",
          "price_cents",
          "price_amount",
          "price_amount_cents",
        ]) ?? 0;
        const tip =
          readMoney(item, ["tip", "tip_amount", "tip_cents", "tip_amount_cents", "gratuity", "gratuity_cents"]) ?? 0;
        return {
          id: item.id,
          start_time: item.start_time,
          service: item.service,
          status: item.status,
          price,
          tip,
          pet_name: item.pet_name ?? null,
        };
      });
      setRows(mapped);
    } catch (cause) {
      console.error("Failed to load appointment history", cause);
      setError("Unable to load appointment history");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [activeFilters, employee.id]);

  useEffect(() => {
    loadRows();
  }, [loadRows, refreshKey]);

  const totals = useMemo(() => {
    const revenue = rows.reduce((sum, row) => sum + (row.price ?? 0), 0);
    const tips = rows.reduce((sum, row) => sum + (row.tip ?? 0), 0);
    return {
      count: rows.length,
      revenue,
      tips,
    };
  }, [rows]);

  const uniqueDays = useMemo(() => {
    const set = new Set(rows.map((row) => row.start_time?.slice(0, 10)).filter(Boolean));
    return set.size || 1;
  }, [rows]);

  const averages = useMemo(() => {
    const days = uniqueDays;
    return {
      dogsPerDay: rows.length / days,
      revenuePerDay: totals.revenue / days,
    };
  }, [rows.length, totals.revenue, uniqueDays]);

  const serviceBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    rows.forEach((row) => {
      const key = row.service ?? "Unknown";
      counts[key] = (counts[key] ?? 0) + 1;
    });
    const total = rows.length || 1;
    return Object.entries(counts)
      .map(([service, count]) => ({ service, count, percent: (count / total) * 100 }))
      .sort((a, b) => b.count - a.count);
  }, [rows]);

  const attendance = useMemo(() => ({
    daysWorked: uniqueDays === 0 ? 0 : uniqueDays,
    late: 0,
    absences: 0,
  }), [uniqueDays]);

  const toggleService = (service: string) => {
    setFormFilters((prev) => {
      const exists = prev.services.includes(service);
      return {
        ...prev,
        services: exists
          ? prev.services.filter((item) => item !== service)
          : [...prev.services, service],
      };
    });
  };

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start date</label>
            <input
              type="date"
              value={formFilters.startDate}
              onChange={(event) =>
                setFormFilters((prev) => ({ ...prev, startDate: event.target.value }))
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">End date</label>
            <input
              type="date"
              value={formFilters.endDate}
              onChange={(event) =>
                setFormFilters((prev) => ({ ...prev, endDate: event.target.value }))
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
            <select
              value={formFilters.status}
              onChange={(event) =>
                setFormFilters((prev) => ({ ...prev, status: event.target.value }))
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All statuses" : option}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Services</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {serviceOptions.length === 0 && (
                <span className="text-xs text-slate-400">No services recorded</span>
              )}
              {serviceOptions.map((service) => {
                const active = formFilters.services.includes(service);
                return (
                  <button
                    type="button"
                    key={service}
                    onClick={() => toggleService(service)}
                    className={clsx(
                      "rounded-full border px-3 py-1 text-xs",
                      active
                        ? "border-brand-hotpink bg-brand-hotpink/10 text-brand-hotpink"
                        : "border-slate-300 text-slate-500 hover:border-brand-blue hover:text-brand-blue"
                    )}
                  >
                    {service}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveFilters(formFilters)}
              className="rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-blue/90"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => {
                setFormFilters(defaultFilters);
                setActiveFilters(defaultFilters);
              }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-brand-navy">Appointment History</h2>
              <p className="text-sm text-slate-500">
                {rows.length} records {activeFilters.startDate && activeFilters.endDate ? "in range" : ""}
              </p>
            </div>
          </header>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-3 py-2">Date / Time</th>
                  <th className="px-3 py-2">Pet / Service</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Tip</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                      Loading history…
                    </td>
                  </tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-slate-400">
                      No records for selected filters
                    </td>
                  </tr>
                )}
                {!loading &&
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => openAppointmentDrawer(row.id)}
                      className="cursor-pointer transition hover:bg-slate-50"
                    >
                      <td className="px-3 py-2 text-slate-600">
                        {new Date(row.start_time).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        <div className="font-medium text-brand-navy">{row.pet_name ?? "—"}</div>
                        <div className="text-xs text-slate-400">{row.service ?? "Service"}</div>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{formatMoney(row.price)}</td>
                      <td className="px-3 py-2 text-slate-600">{formatMoney(row.tip)}</td>
                      <td className="px-3 py-2">
                        <StatusPill status={row.status} />
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr className="text-sm font-semibold text-brand-navy">
                  <td className="px-3 py-3">Totals</td>
                  <td className="px-3 py-3 text-slate-500">{totals.count} appts</td>
                  <td className="px-3 py-3">{formatMoney(totals.revenue)}</td>
                  <td className="px-3 py-3">{formatMoney(totals.tips)}</td>
                  <td className="px-3 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
          {error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">{error}</div>
          )}
        </section>
        <aside className="space-y-4">
          <MetricCard title="Averages">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Dogs / day</span>
              <span className="font-semibold text-brand-navy">{averages.dogsPerDay.toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Revenue / day</span>
              <span className="font-semibold text-brand-navy">{formatMoney(averages.revenuePerDay)}</span>
            </div>
          </MetricCard>
          <MetricCard title="Service breakdown">
            {serviceBreakdown.length === 0 && (
              <p className="text-sm text-slate-400">No services to display</p>
            )}
            <div className="space-y-3">
              {serviceBreakdown.map((item) => (
                <div key={item.service}>
                  <div className="flex justify-between text-xs font-medium text-slate-500">
                    <span>{item.service}</span>
                    <span>{item.percent.toFixed(0)}%</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-brand-blue"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </MetricCard>
          <MetricCard title="Attendance summary">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Days worked</span>
                <span className="font-semibold text-brand-navy">{attendance.daysWorked}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Late</span>
                <span className="font-semibold text-brand-navy">{attendance.late}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Absences</span>
                <span className="font-semibold text-brand-navy">{attendance.absences}</span>
              </div>
            </div>
          </MetricCard>
        </aside>
      </div>
    </div>
  );
}

type StatusPillProps = {
  status: string | null;
};

function StatusPill({ status }: StatusPillProps) {
  if (!status) {
    return <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500">—</span>;
  }
  const normalized = status.toLowerCase();
  const classes = clsx(
    "rounded-full border px-3 py-1 text-xs font-semibold capitalize",
    normalized.includes("completed") && "border-emerald-200 bg-emerald-50 text-emerald-700",
    normalized.includes("cancel") && "border-rose-200 bg-rose-50 text-rose-600",
    normalized.includes("no-show") && "border-amber-200 bg-amber-50 text-amber-600",
    normalized.includes("progress") && "border-indigo-200 bg-indigo-50 text-indigo-600",
    normalized.includes("scheduled") && "border-sky-200 bg-sky-50 text-sky-600"
  );
  return <span className={classes}>{status}</span>;
}

type MetricCardProps = {
  title: string;
  children: ReactNode;
};

function MetricCard({ title, children }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}
