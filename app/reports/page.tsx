"use client";
import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

// Supported date ranges for the reports page
type RangeOption = "today" | "week" | "month" | "year" | "all";

// Data structure for counts and metrics
interface Counts {
  clients: number;
  newClients: number;
  pets: number;
  newPets: number;
  employees: number;
  appointments: number;
  completed: number;
  canceled: number;
  noShow: number;
  revenue: number;
  expectedRevenue: number;
  sales: number;
  topServices: [string, number][];
}

// Helper to calculate start and end dates for a given range relative to now
function getRangeDates(range: RangeOption): { start?: Date; end?: Date } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  switch (range) {
    case "today":
      start.setHours(0, 0, 0, 0);
      end.setHours(24, 0, 0, 0);
      return { start, end };
    case "week": {
      // start of week (Sunday)
      const day = now.getDay();
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 7);
      end.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case "month": {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 1, 1);
      end.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case "year": {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setFullYear(start.getFullYear() + 1, 0, 1);
      end.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case "all":
    default:
      return {};
  }
}

export default function ReportsPage() {
  const [range, setRange] = useState<RangeOption>("today");
  const [counts, setCounts] = useState<Counts>({
    clients: 0,
    newClients: 0,
    pets: 0,
    newPets: 0,
    employees: 0,
    appointments: 0,
    completed: 0,
    canceled: 0,
    noShow: 0,
    revenue: 0,
    expectedRevenue: 0,
    sales: 0,
    topServices: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { start, end } = getRangeDates(range);

      // Build queries for counts
      const clientsQuery = supabase.from("clients").select("id", { count: "exact", head: true });
      const petsQuery = supabase.from("pets").select("id", { count: "exact", head: true });
      const employeesQuery = supabase.from("employees").select("id", { count: "exact", head: true });
      const apptCountQuery = supabase.from("appointments").select("id", { count: "exact", head: true });

      // Filtered queries for new clients and pets
      const newClientsQuery = start && end
        ? supabase.from("clients").select("id", { count: "exact", head: true }).gte("created_at", start.toISOString()).lt("created_at", end.toISOString())
        : supabase.from("clients").select("id", { count: "exact", head: true });
      const newPetsQuery = start && end
        ? supabase.from("pets").select("id", { count: "exact", head: true }).gte("created_at", start.toISOString()).lt("created_at", end.toISOString())
        : supabase.from("pets").select("id", { count: "exact", head: true });

      // Payments query for sales
      let paymentsQuery = supabase.from("payments").select("amount");
      if (start && end) {
        paymentsQuery = paymentsQuery.gte("created_at", start.toISOString()).lt("created_at", end.toISOString());
      }

      // Appointments details for the selected range
      let apptDetailQuery = supabase.from("appointments").select("service, status, price");
      if (start && end) {
        apptDetailQuery = apptDetailQuery.gte("start_time", start.toISOString()).lt("start_time", end.toISOString());
      }

      const [clientsRes, petsRes, employeesRes, apptCountRes, newClientsRes, newPetsRes, apptDetailRes, paymentsRes] = await Promise.all([
        clientsQuery,
        petsQuery,
        employeesQuery,
        apptCountQuery,
        newClientsQuery,
        newPetsQuery,
        apptDetailQuery,
        paymentsQuery,
      ]);

      // Process appointment details
      const appts = (apptDetailRes.data || []) as any[];
      const completed = appts.filter((a) => a.status === "Completed").length;
      const canceled = appts.filter((a) => a.status === "Cancelled").length;
      // Count no-shows
      const noShow = appts.filter((a) => a.status === "No show" || a.status === "No-show").length;
      const revenue = appts.reduce((sum, a) => sum + (a.status === "Completed" ? Number(a.price || 0) : 0), 0);
      // Expected revenue: sum of all appointment prices regardless of status
      const expectedRevenue = appts.reduce((sum, a) => sum + (a.price ? Number(a.price) : 0), 0);
      // Sales: sum of payments amounts in range
      const payments = (paymentsRes.data || []) as any[];
      const sales = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
      const serviceCounts: Record<string, number> = {};
      appts.forEach((a) => {
        const service = a.service || "Other";
        serviceCounts[service] = (serviceCounts[service] || 0) + 1;
      });
      const topServices = Object.entries(serviceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3) as [string, number][];

      setCounts({
        clients: clientsRes.count || 0,
        newClients: newClientsRes.count || 0,
        pets: petsRes.count || 0,
        newPets: newPetsRes.count || 0,
        employees: employeesRes.count || 0,
        appointments: apptCountRes.count || 0,
        completed,
        canceled,
        noShow,
        revenue,
        expectedRevenue,
        sales,
        topServices,
      });
      setLoading(false);
    };
    fetchData();
  }, [range]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 pb-20 md:p-8">
        <h1 className="text-2xl font-bold mb-4">Reports</h1>
        {/* Range selector */}
        <div className="mb-4">
          <label htmlFor="range" className="mr-2 font-medium">Date range:</label>
          <select
            id="range"
            value={range}
            onChange={(e) => setRange(e.target.value as RangeOption)}
            className="border rounded px-3 py-2"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ReportCard title="Total Clients" value={counts.clients} />
              <ReportCard title="New Clients" value={counts.newClients} />
              <ReportCard title="Total Pets" value={counts.pets} />
              <ReportCard title="New Pets" value={counts.newPets} />
              <ReportCard title="Employees" value={counts.employees} />
              <ReportCard title="Appointments" value={counts.appointments} />
              <ReportCard title="Completed" value={counts.completed} />
              <ReportCard title="Canceled" value={counts.canceled} />
              <ReportCard title="No-shows" value={counts.noShow} />
              <ReportCard title="Revenue" value={`$${counts.revenue.toFixed(2)}`} />
              <ReportCard title="Expected Revenue" value={`$${counts.expectedRevenue.toFixed(2)}`} />
              <ReportCard title="Sales" value={`$${counts.sales.toFixed(2)}`} />
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
