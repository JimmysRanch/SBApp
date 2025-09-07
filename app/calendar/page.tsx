"use client";
import Sidebar from "@/components/Sidebar";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

type Appt = {
  id: string;
  start_time: string;
  service: string | null;
  status: string;
  pets: { name: string } | null;
  clients: { full_name: string } | null;
};

export default function CalendarPage() {
  const [rows, setRows] = useState<Appt[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("id,start_time,service,status,pets(name),clients(full_name)")
        .order("start_time");
      if (!error && data) {
        setRows(data as Appt[]);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-4">Calendar</h1>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="p-3">Date & Time</th>
              <th>Pet</th>
              <th>Client</th>
              <th>Service</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b">
                <td className="p-3">{new Date(row.start_time).toLocaleString()}</td>
                <td>{row.pets?.name || "—"}</td>
                <td>{row.clients?.full_name || "—"}</td>
                <td>{row.service || "—"}</td>
                <td>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
