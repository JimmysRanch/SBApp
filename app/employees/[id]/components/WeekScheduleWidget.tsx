"use client";
import { useEffect, useState } from "react";
import Widget from "@/components/Widget";
import { supabase } from "@/lib/supabase/client";

type Props = { employeeId: string };

type Row = {
  day: string;
  start_time: string | null;
  end_time: string | null;
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function WeekScheduleWidget({ employeeId }: Props) {
  const [schedule, setSchedule] = useState<Record<string, Row>>({});

  useEffect(() => {
    const fetchSchedule = async () => {
      const { data, error } = await supabase
        .from("employee_schedules")
        .select("day,start_time,end_time")
        .eq("employee_id", employeeId);
      if (!error && data) {
        const map: Record<string, Row> = {};
        data.forEach((row) => {
          map[row.day] = row as Row;
        });
        setSchedule(map);
      }
    };
    fetchSchedule();
  }, [employeeId]);

  return (
    <Widget title="Week Schedule" color="green">
      <table className="w-full text-sm">
        <tbody>
          {DAYS.map((d) => {
            const row = schedule[d] || { start_time: null, end_time: null };
            return (
              <tr key={d} className="border-b last:border-b-0">
                <td className="py-1 font-medium">{d}</td>
                <td className="py-1 text-right">
                  {row.start_time ? row.start_time : "--"} - {row.end_time ? row.end_time : "--"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Widget>
  );
}
