"use client";
import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { supabase } from "../../../../supabase/client";
import Link from "next/link";
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
type Row = { dow: number; start_time: string | null; end_time: string | null; break_minutes: number };
export default function WeekScheduleWidget({ employeeId }: { employeeId: number }) {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => { let on = true;
    (async () => {
      const { data } = await supabase.from("employee_schedule_templates")
        .select("dow,start_time,end_time,break_minutes").eq("employee_id", employeeId);
      if (!on) return;
      const map = new Map<number, Row>(); (data||[]).forEach(r=>map.set(r.dow, r as Row));
      setRows(Array.from({length:7},(_,i)=> map.get(i) ?? { dow:i, start_time:null, end_time:null, break_minutes:0 }));
    })();
    return () => { on = false; };
  }, [employeeId]);
  return (
    <Card>
      <h3 className="text-lg font-semibold">Week Schedule</h3>
      <ul className="mt-3 space-y-1 text-sm">
        {rows.map(r => (
          <li key={r.dow} className="flex justify-between">
            <span>{DAYS[r.dow]}</span>
            <span>{r.start_time && r.end_time ? `${r.start_time} – ${r.end_time}` : "Off"}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 text-right">
        <Link href={`/employees/${employeeId}/schedule`} className="text-primary underline text-sm">
          Open calendar
        </Link>
      </div>
    </Card>
  );
}
