"use client";
import { useEffect, useState } from "react";
import Widget from "@/components/Widget";
import { supabase } from "@/lib/supabase/client";

interface Appointment {
  id: string;
  pet_name: string | null;
  service: string | null;
  scheduled_time: string;
  status: string | null;
}

type Props = { employeeId: string; kind?: "upcoming" | "past" };

export default function AppointmentsList({ employeeId, kind = "upcoming" }: Props) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const fetchAppts = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let query = supabase
        .from("appointments")
        .select("id,pet_name,service,scheduled_time,status")
        .eq("employee_id", employeeId)
        .order("scheduled_time", { ascending: true });
      if (kind === "upcoming") {
        query = query.gte("scheduled_time", today.toISOString());
      } else {
        query = query.lt("scheduled_time", today.toISOString());
      }
      const { data, error } = await query;
      if (!error && data) {
        setAppointments(data as Appointment[]);
      }
    };
    fetchAppts();
  }, [employeeId, kind]);

  return (
    <Widget title={kind === "upcoming" ? "Upcoming Appointments" : "Past Appointments"}>
      {appointments.length === 0 ? (
        <p className="text-sm text-gray-600">No appointments.</p>
      ) : (
        <ul className="space-y-1 text-sm text-gray-600">
          {appointments.map((a) => (
            <li key={a.id} className="flex justify-between">
              <span>
                {a.pet_name} - {a.service}
              </span>
              <span>
                {new Date(a.scheduled_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {a.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Widget>
  );
}
