"use client";

import { useEffect, useState } from "react";
import Widget from "@/components/Widget";
import { supabase } from "@/supabase/client";

type Appointment = {
  id: string;
  start_time: string;
  end_time: string;
  service: string | null;
  status: string | null;
  pet_id: string | null;
  client_id: string | null;
};

type Props = { employeeId: string };

export default function AppointmentsList({ employeeId }: Props) {
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [past, setPast] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAppointments = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: upcomingData } = await supabase
        .from("appointments")
        .select(
          "id,start_time,end_time,service,status,pet_id,client_id"
        )
        .eq("employee_id", employeeId)
        .gte("start_time", today.toISOString())
        .order("start_time", { ascending: true })
        .limit(20);

      const { data: pastData } = await supabase
        .from("appointments")
        .select(
          "id,start_time,end_time,service,status,pet_id,client_id"
        )
        .eq("employee_id", employeeId)
        .lt("start_time", today.toISOString())
        .order("start_time", { ascending: false })
        .limit(20);

      setUpcoming(upcomingData ?? []);
      setPast(pastData ?? []);
      setLoading(false);
    };
    loadAppointments();
  }, [employeeId]);

  if (loading) {
    return <Widget title="Appointments">Loading...</Widget>;
  }

  return (
    <Widget title="Appointments">
      {upcoming.length === 0 && past.length === 0 ? (
        <p className="text-sm text-gray-600">No appointments found.</p>
      ) : (
        <div className="space-y-4">
          {upcoming.length > 0 && (
            <div>
              <h3 className="mb-1 font-semibold">Upcoming</h3>
              <ul className="list-disc pl-5 text-sm text-gray-600">
                {upcoming.map((appt) => (
                  <li key={appt.id}>
                    {new Date(appt.start_time).toLocaleString()} -
                    {" "}
                    {appt.service ?? "Appointment"}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h3 className="mb-1 font-semibold">Past</h3>
              <ul className="list-disc pl-5 text-sm text-gray-600">
                {past.map((appt) => (
                  <li key={appt.id}>
                    {new Date(appt.start_time).toLocaleString()} -
                    {" "}
                    {appt.service ?? "Appointment"}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Widget>
  );
}
