"use client";
import Sidebar from "@/components/Sidebar";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

// Appointment type including joined pet and client names.  The Supabase
// query uses `pets(name)` and `clients(full_name)` to join in these
// fields via foreign keys on the appointments table.
type Appt = {
  id: string;
  start_time: string;
  service: string | null;
  status: string;
  pets: { name: string }[];
  clients: { full_name: string }[];
};

/**
 * Calendar page showing all appointments.  Appointments are loaded
 * from the `appointments` table along with pet and client names.
 */
export default function CalendarPage() {
  const [rows, setRows] = useState<Appt[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, start_time, service, status, pets(name), clients(full_name)")
        .order("start_time");
      if (!error && data) {
        // Cast through unknown to satisfy TypeScript since Supabase types
        // are generated as any when joined.  See build error logs for
        // details.
        setRows(data as unknown as Appt[]);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 pb-20 md:p-8">
        <h1 className="text-2xl font-bold mb-4">Calendar</h1>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Date &amp; Time</th>
              <th>Pet</th>
              <th>Client</th>
              <th>Service</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b">
                <td className="p-2">
                  {new Date(row.start_time).toLocaleString()}
                </td>
                <td>{row.pets?.[0]?.name ?? "-"}</td>
                <td>{row.clients?.[0]?.full_name ?? "-"}</td>
                <td>{row.service ?? "-"}</td>
                <td>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
