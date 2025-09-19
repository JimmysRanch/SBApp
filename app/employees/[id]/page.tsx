"use client";

import { useEffect, useState } from "react";

import type { PostgrestError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase/client";

import {
  computeDurationHours,
  getUtcDayRange,
  getUtcWeekRange,
  isMissingColumnError,
  readMoney,
  shouldFallbackToAppointments,
  toNumber,
} from "./data-helpers";

import OverviewWidgets, { OverviewMetrics } from "./components/OverviewWidgets";
import RecentJobs, { RecentJobRow } from "./components/RecentJobs";
import { useEmployeeDetail } from "./EmployeeDetailClient";

const emptyMetrics: OverviewMetrics = {
  todayDogs: 0,
  todayHours: 0,
  weekDogs: 0,
  weekRevenue: 0,
  weekCommission: 0,
  lifetimeDogs: 0,
  lifetimeRevenue: 0,
};

export default function EmployeeOverviewPage() {
  const { employee, goals, openAppointmentDrawer, refreshKey } = useEmployeeDetail();

  const [metrics, setMetrics] = useState<OverviewMetrics>(emptyMetrics);
  const [recent, setRecent] = useState<RecentJobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const weeklyTarget = goals?.weekly_revenue_target ?? null;
  const dogsTarget = goals?.desired_dogs_per_day ?? null;

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [todayRes, weekRes, lifetimeRes, recentRes] = await Promise.all([
          supabase.rpc("staff_today_metrics", { staff_id: employee.id }),
          supabase.rpc("staff_week_metrics", { staff_id: employee.id }),
          supabase.rpc("staff_lifetime_metrics", { staff_id: employee.id }),
          supabase
            .from("appointments")
            .select("id,start_time,service,status,price,price_cents,pet_name")
            .eq("employee_id", employee.id)
            .order("start_time", { ascending: false })
            .limit(8),
        ]);

        const today = await resolveTodayMetrics(todayRes, employee.id);
        const week = await resolveWeekMetrics(weekRes, employee.id, employee.commission_rate);
        const lifetime = await resolveLifetimeMetrics(lifetimeRes, employee.id);
        const recentRows = await resolveRecentAppointments(recentRes, employee.id);

        if (!active) return;

        setMetrics({
          todayDogs: today.dogs ?? 0,
          todayHours: today.hours ?? 0,
          weekDogs: week.dogs ?? 0,
          weekRevenue: week.revenue ?? 0,
          weekCommission: week.commission ?? 0,
          lifetimeDogs: lifetime.dogs ?? 0,
          lifetimeRevenue: lifetime.revenue ?? 0,
        });

        const rows = recentRows.map((row: any) => ({
          id: row.id,
          start: row.start_time,
          pet: row.pet_name ?? null,
          service: row.service ?? null,
          price: readMoney(row, ["price", "price_cents", "price_amount", "price_amount_cents"]),
          status: row.status ?? null,
        }));

        setRecent(rows as RecentJobRow[]);
      } catch (cause) {
        if (!active) return;
        console.error("Failed to load staff overview", cause);
        setError("Unable to load staff overview");
        setMetrics(emptyMetrics);
        setRecent([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [employee.commission_rate, employee.id, refreshKey]);

  return (
    <div className="space-y-6">
      <OverviewWidgets
        loading={loading}
        metrics={metrics}
        weeklyTarget={weeklyTarget}
        dogsTarget={dogsTarget}
      />
      <RecentJobs loading={loading} rows={recent} onSelect={openAppointmentDrawer} />
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">{error}</div>
      )}
    </div>
  );
}

type TodayMetrics = { dogs: number | null; hours: number | null };
type WeekMetrics = { dogs: number | null; revenue: number | null; commission: number | null };
type LifetimeMetrics = { dogs: number | null; revenue: number | null };

type SimpleResponse<T> = { data: T | null; error: PostgrestError | null };

async function resolveTodayMetrics(
  response: SimpleResponse<any>,
  employeeId: number
): Promise<TodayMetrics> {
  if (!response.error && response.data) {
    const payload = Array.isArray(response.data) ? response.data[0] ?? {} : response.data;
    return {
      dogs: toNumber(payload?.dogs),
      hours: toNumber(payload?.hours),
    };
  }

  if (response.error && shouldFallbackToAppointments(response.error)) {
    return computeTodayMetricsFromAppointments(employeeId);
  }

  if (response.error) {
    throw response.error;
  }

  return { dogs: 0, hours: 0 };
}

async function resolveWeekMetrics(
  response: SimpleResponse<any>,
  employeeId: number,
  commissionRate: number | string | null | undefined
): Promise<WeekMetrics> {
  if (!response.error && response.data) {
    const payload = Array.isArray(response.data) ? response.data[0] ?? {} : response.data;
    return {
      dogs: toNumber(payload?.dogs),
      revenue: toNumber(payload?.revenue),
      commission: toNumber(payload?.commission),
    };
  }

  if (response.error && shouldFallbackToAppointments(response.error)) {
    return computeWeekMetricsFromAppointments(employeeId, commissionRate);
  }

  if (response.error) {
    throw response.error;
  }

  return { dogs: 0, revenue: 0, commission: 0 };
}

async function resolveLifetimeMetrics(
  response: SimpleResponse<any>,
  employeeId: number
): Promise<LifetimeMetrics> {
  if (!response.error && response.data) {
    const payload = Array.isArray(response.data) ? response.data[0] ?? {} : response.data;
    return {
      dogs: toNumber(payload?.dogs),
      revenue: toNumber(payload?.revenue),
    };
  }

  if (response.error && shouldFallbackToAppointments(response.error)) {
    return computeLifetimeMetricsFromAppointments(employeeId);
  }

  if (response.error) {
    throw response.error;
  }

  return { dogs: 0, revenue: 0 };
}

async function resolveRecentAppointments(
  response: SimpleResponse<any>,
  employeeId: number
) {
  if (!response.error) {
    return (response.data as any[]) ?? [];
  }

  if (isMissingColumnError(response.error)) {
    const fallback = await buildRecentAppointmentsQuery(employeeId, "*");
    if (!fallback.error) {
      return (fallback.data as any[]) ?? [];
    }
    throw fallback.error;
  }

  throw response.error;
}

async function computeTodayMetricsFromAppointments(employeeId: number): Promise<TodayMetrics> {
  const { start, end } = getUtcDayRange(new Date());
  const { data, error } = await supabase
    .from("appointments")
    .select("start_time,end_time")
    .eq("employee_id", employeeId)
    .gte("start_time", start.toISOString())
    .lt("start_time", end.toISOString());

  if (error) {
    throw error;
  }

  const rows = (data as any[]) ?? [];
  const hours = rows.reduce((total, row) => total + computeDurationHours(row?.start_time, row?.end_time), 0);
  return { dogs: rows.length, hours };
}

async function computeWeekMetricsFromAppointments(
  employeeId: number,
  commissionRate: number | string | null | undefined
): Promise<WeekMetrics> {
  const { start, end } = getUtcWeekRange(new Date());
  const { data, error } = await supabase
    .from("appointments")
    .select("start_time,price,price_cents,price_amount,price_amount_cents")
    .eq("employee_id", employeeId)
    .gte("start_time", start.toISOString())
    .lt("start_time", end.toISOString());

  if (error) {
    throw error;
  }

  const rate = toNumber(commissionRate) ?? 0;
  const rows = (data as any[]) ?? [];
  let revenue = 0;
  let commission = 0;
  rows.forEach((row) => {
    const price = readMoney(row, ["price", "price_cents", "price_amount", "price_amount_cents"]) ?? 0;
    revenue += price;
    commission += price * rate;
  });
  return { dogs: rows.length, revenue, commission };
}

async function computeLifetimeMetricsFromAppointments(employeeId: number): Promise<LifetimeMetrics> {
  const { data, error } = await supabase
    .from("appointments")
    .select("price,price_cents,price_amount,price_amount_cents")
    .eq("employee_id", employeeId);

  if (error) {
    throw error;
  }

  const rows = (data as any[]) ?? [];
  const revenue = rows.reduce(
    (sum, row) => sum + (readMoney(row, ["price", "price_cents", "price_amount", "price_amount_cents"]) ?? 0),
    0
  );
  return { dogs: rows.length, revenue };
}

function buildRecentAppointmentsQuery(employeeId: number, columns: string) {
  return supabase
    .from("appointments")
    .select(columns)
    .eq("employee_id", employeeId)
    .order("start_time", { ascending: false })
    .limit(8);
}
