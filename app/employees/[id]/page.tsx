"use client";

import { useEffect, useState } from "react";

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

      setMetrics({
        todayDogs: todayRes.data?.dogs ?? 0,
        todayHours: todayRes.data?.hours ?? 0,
        weekDogs: weekRes.data?.dogs ?? 0,
        weekRevenue: weekRes.data?.revenue ?? 0,
        weekCommission: weekRes.data?.commission ?? 0,
        lifetimeDogs: lifetimeRes.data?.dogs ?? 0,
        lifetimeRevenue: lifetimeRes.data?.revenue ?? 0,
      });

      const rows = (recentRes.data ?? []).map((row: any) => ({
        id: row.id,
        start: row.start_time,
        pet: row.pet_name ?? null,
        service: row.service ?? null,
        price:
          typeof row.price === "number"
            ? row.price
            : typeof row.price_cents === "number"
            ? row.price_cents / 100
            : null,
        status: row.status ?? null,
      }));

      setRecent(rows as RecentJobRow[]);
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
