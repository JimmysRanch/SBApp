"use client";
import { useEffect, useState } from "react";
import Widget from "@/components/Widget";
import { supabase } from "@/lib/supabase/client";

type Props = { employeeId: string };

type Row = {
  duration: number | null;
  status: string | null;
};

export default function TodayWorkload({ employeeId }: Props) {
  const [dogs, setDogs] = useState(0);
  const [hours, setHours] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const fetchWorkload = async () => {
      const today = new Date();
      const start = new Date(today);
      start.setHours(0, 0, 0, 0);
      const end = new Date(today);
      end.setHours(23, 59, 59, 999);
      const { data, error } = await supabase
        .from("appointments")
        .select("duration,status")
        .eq("employee_id", employeeId)
        .gte("scheduled_time", start.toISOString())
        .lte("scheduled_time", end.toISOString());
      if (!error && data) {
        const rows = data as Row[];
        const totalDogs = rows.length;
        const totalMinutes = rows.reduce((sum, r) => sum + (r.duration || 0), 0);
        const done = rows.filter((r) => r.status === "Completed").length;
        setDogs(totalDogs);
        setHours(totalMinutes / 60);
        setCompleted(done);
        setPending(totalDogs - done);
      }
    };
    fetchWorkload();
  }, [employeeId]);

  return (
    <Widget title="Today's Workload">
      <p>Dogs: {dogs}</p>
      <p>Hours: {hours.toFixed(1)}</p>
      <p>Completed: {completed}</p>
      <p>Pending: {pending}</p>
    </Widget>
  );
}
