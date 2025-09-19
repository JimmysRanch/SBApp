"use client";

import { useEffect, useState } from "react";

import { parseCurrency, parseNumeric } from "@/lib/numbers";
import { supabase } from "@/lib/supabase/client";

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

function unwrapSingle<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return (value[0] ?? null) as T | null;
  }
  return (value ?? null) as T | null;
}

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

      if (!active) return;

      if (todayRes.error || weekRes.error || lifetimeRes.error || recentRes.error) {
        setError("Unable to load staff overview");
        setLoading(false);
        return;
      }

      const todayData = unwrapSingle(todayRes.data);
      const weekData = unwrapSingle(weekRes.data);
      const lifetimeData = unwrapSingle(lifetimeRes.data);

      setMetrics({
        todayDogs: parseNumeric(todayData?.dogs) ?? 0,
        todayHours: parseNumeric(todayData?.hours) ?? 0,
        weekDogs: parseNumeric(weekData?.dogs) ?? 0,
        weekRevenue: parseCurrency(weekData?.revenue) ?? 0,
        weekCommission: parseCurrency(weekData?.commission) ?? 0,
        lifetimeDogs: parseNumeric(lifetimeData?.dogs) ?? 0,
        lifetimeRevenue: parseCurrency(lifetimeData?.revenue) ?? 0,
      });

      const rows = (recentRes.data ?? [])
        .map((row: any) => {
          const id = parseNumeric(row.id);
          if (id === null) return null;
          return {
            id,
            start: row.start_time,
            pet: row.pet_name ?? null,
            service: row.service ?? null,
            price: parseCurrency(row.price, row.price_cents),
            status: row.status ?? null,
          } as RecentJobRow;
        })
        .filter((row): row is RecentJobRow => row !== null);

      setRecent(rows);
      setLoading(false);
    };

    load();

    return () => {
      active = false;
    };
  }, [employee.id, refreshKey]);

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
