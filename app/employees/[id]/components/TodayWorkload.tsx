"use client";

import { useEffect, useState } from "react";
import Widget from "@/components/Widget";
import { supabase } from "@/supabase/client";

type Props = { employeeId: string };

export default function TodayWorkload({ employeeId }: Props) {
  const [dogsToday, setDogsToday] = useState<number | null>(null);
  const [hours, setHours] = useState<number | null>(null);
  const [completed, setCompleted] = useState<number | null>(null);

  useEffect(() => {
    const loadWorkload = async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);

      const { data } = await supabase
        .from("appointments")
        .select("start_time,end_time,status")
        .eq("employee_id", employeeId)
        .gte("start_time", start.toISOString())
        .lte("start_time", end.toISOString());

      if (data) {
        setDogsToday(data.length);
        const totalHours = data.reduce((sum, row) => {
          const startTime = new Date(row.start_time);
          const endTime = new Date(row.end_time);
          return sum + (endTime.getTime() - startTime.getTime()) / 3600000;
        }, 0);
        setHours(totalHours);
        setCompleted(data.filter((r) => r.status === "completed").length);
      }
    };
    loadWorkload();
  }, [employeeId]);

  if (dogsToday === null || hours === null || completed === null) {
    return <Widget title="Today's Workload">Loading...</Widget>;
  }

  return (
    <Widget title="Today's Workload">
      <p>Dogs Today: {dogsToday}</p>
      <p>Hours: {hours.toFixed(2)}</p>
      <p>Completed: {completed}</p>
    </Widget>
  );
}
