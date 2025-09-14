"use client";

import { useEffect, useState } from "react";
import Widget from "@/components/Widget";
import { supabase } from "@/supabase/client";

type Schedule = {
  day_of_week: number;
  start_time: string | null;
  end_time: string | null;
};

type Props = { employeeId: string };

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function WeekScheduleWidget({ employeeId }: Props) {
  const [schedule, setSchedule] = useState<Record<number, Schedule>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSchedule = async () => {
      const { data } = await supabase
        .from("employee_schedule_templates")
        .select("day_of_week,start_time,end_time")
        .eq("employee_id", employeeId);
      if (data) {
        const map: Record<number, Schedule> = {};
        data.forEach((row) => {
          map[row.day_of_week as number] = row as Schedule;
        });
        setSchedule(map);
      }
      setLoading(false);
    };
    loadSchedule();
  }, [employeeId]);

  if (loading) {
    return <Widget title="Week Schedule" color="green">Loading...</Widget>;
  }

  return (
    <Widget title="Week Schedule" color="green">
      <ul className="text-sm text-gray-600">
        {DAYS.map((day, idx) => {
          const entry = schedule[idx];
          return (
            <li key={day} className="flex justify-between">
              <span>{day}</span>
              {entry && entry.start_time && entry.end_time ? (
                <span>
                  {new Date(entry.start_time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" - "}
                  {new Date(entry.end_time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              ) : (
                <span>Off</span>
              )}
            </li>
          );
        })}
      </ul>
    </Widget>
  );
}
