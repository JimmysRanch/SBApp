"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Appointment = {
  id: number;
  start_time: string;
  end_time: string;
  pets: { name: string } | null;
  services: { name: string } | null;
};

export default function CalendarPage() {
  const supabase = createClient();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id,
          start_time,
          end_time,
          pets ( name ),
          services ( name )
        `)
        .gte("start_time", new Date().toISOString()) // only future appts
        .order("start_time", { ascending: true });

      if (error) {
        setError(error.message);
      } else {
        setAppointments(data || []);
      }
      setLoading(false);
    };

    fetchAppointments();
  }, [supabase]);

  if (loading) return <p>Loading calendar...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Upcoming Appointments</h1>
      {appointments.length === 0 ? (
        <p>No upcoming appointments.</p>
      ) : (
        <ul className="space-y-4">
          {appointments.map((appt) => (
            <li
              key={appt.id}
              className="border rounded-lg p-4 shadow-sm bg-white"
            >
              <p className="font-semibold">
                {appt.pets?.name || "Unknown Pet"} –{" "}
                {appt.services?.name || "Service"}
              </p>
              <p className="text-sm text-gray-600">
                {new Date(appt.start_time).toLocaleString()} →{" "}
                {new Date(appt.end_time).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
