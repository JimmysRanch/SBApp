"use client";
import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Counts {
  clients: number;
  pets: number;
  employees: number;
  appointments: number;
  completedToday: number;
  completedWeek: number;
  revenueToday: number;
  revenueWeek: number;
  topServices: [string, number][];
}

export default function ReportsPage() {
  const [counts, setCounts] = useState<Counts>({
    clients: 0,
    pets: 0,
    employees: 0,
    appointments: 0,
    completedToday: 0,
    completedWeek: 0,
    revenueToday: 0,
    revenueWeek: 0,
    topServices: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Start of today and tomorrow
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      // Start of current week (Sunday) and next week
      const weekStart = new Date(todayStart);
      const day = weekStart.getDay();
      // adjust to Sunday (0) or Monday (1)? For U.S. we consider Sunday as start
      weekStart.setDate(weekStart.getDate() - day);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const [clientsCountRes, petsCountRes, employeesCountRes, apptCountRes] = await Promise.all([
        supabase.from("clients").select("id", { count: "exact", head: true }),
        supabase.from("pets").select("id", { count: "exact", head: true }),
        supabase.from("employees").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("id", { count: "exact", head: true }),
      ]);

      const { data: apptToday } = await supabase
        .from("appointments")
        .select("service, price, status, start_time")
        .gte("start_time", todayStart.toISOString())
        .lt("start_time", tomorrowStart.toISOString());
      const { data: apptWeek } = await supabase
        .from("appointments")
        .select("service, price, status, start_time")
        .gte("start_time", weekStart.toISOString())
        .lt("start_time", weekEnd.toISOString());
      const { data: apptAll } = await supabase
        .from("appointments")
        .select("service");

      // compute metrics
      const completedToday = (apptToday || []).filter((a: any) => a.status === "Completed").length;
      const completedWeek = (apptWeek || []).filter((a: any) => a.status === "Completed").length;
      const revenueToday = (apptToday || []).reduce((sum: number, a: any) => sum + (a.status === "Completed" ? Number(a.price || 0) : 0), 0);
      const revenueWeek = (apptWeek || []).reduce((sum: number, a: any) => sum + (a.status === "Completed" ? Number(a.price || 0) : 0), 0);

      const serviceCounts: Record<string, number> = {};
      (apptAll || []).forEach((a: any) => {
        const service = a.service || "Other";
        serviceCounts[service] = (serviceCounts[service] || 0) + 1;
      });
      const topServices = Object.entries(serviceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3) as [string, number][];

      setCounts({
        clients: clientsCountRes.count || 0,
        pets: petsCountRes.count || 0,
        employees: employeesCountRes.count || 0,
        appointments: apptCountRes.count || 0,
        completedToday,
        completedWeek,
        revenueToday,
        revenueWeek,
        topServices,
      });
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-4">Reports</h1>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ReportCard title="Clients" value={counts.clients} />
              <ReportCard title="Pets" value={counts.pets} />
              <ReportCard title="Employees" value={counts.employees} />
              <ReportCard title="Total Appointments" value={counts.appointments} />
              <ReportCard title="Appointments Completed Today" value={counts.completedToday} />
              <ReportCard title="Appointments Completed This Week" value={counts.completedWeek} />
              <ReportCard title="Revenue Today" value={`$${counts.revenueToday.toFixed(2)}`} />
              <ReportCard title="Revenue This Week" value={`$${counts.revenueWeek.toFixed(2)}`} />
            </div>
            <div className="p-4 bg-white rounded shadow">
              <h2 className="text-xl font-semibold mb-2">Top Services</h2>
              {counts.topServices.length === 0 ? (
                <p className="text-gray-500 text-sm">No services found</p>
              ) : (
                <ul className="text-sm">
                  {counts.topServices.map(([service, count]) => (
                    <li key={service} className="flex justify-between py-1 border-b last:border-none">
                      <span>{service}</span>
                      <span className="font-medium">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ReportCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="p-4 bg-white rounded shadow">
      <div className="text-sm text-gray-500 mb-1">{title}</div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );
}
