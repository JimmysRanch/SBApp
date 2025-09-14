"use client";
import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { supabase } from "../../../../supabase/client";
type Row = { id: number; start_time: string; end_time: string | null; status: string; service?: string | null; client_id?: number | null; pet_id?: number | null };
export default function AppointmentsList({ employeeId, kind }: { employeeId: number; kind: "upcoming"|"past" }) {
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(()=>{ let on=true;(async()=>{
    const now = new Date().toISOString();
    let q = supabase.from("appointments").select("id,start_time,end_time,status,service,client_id,pet_id").eq("employee_id", employeeId);
    q = kind==="upcoming" ? q.gte("start_time", now).order("start_time", { ascending: true }).limit(20)
                          : q.lt("start_time", now).order("start_time", { ascending: false }).limit(20);
    const { data } = await q;
    if(on) setRows((data||[]) as Row[]);
  })(); return ()=>{on=false}; },[employeeId,kind]);
  return (
    <Card>
      <h3 className="text-lg font-semibold">{kind==="upcoming"?"Upcoming Appointments":"Past Appointments"}</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {rows.length===0 && <li className="text-gray-500">None</li>}
        {rows.map(r => (
          <li key={r.id} className="flex justify-between">
            <span>{new Date(r.start_time).toLocaleString()}</span>
            <span className="truncate max-w-[50%] text-right">{r.service ?? "Service"}</span>
            <span className="text-gray-600">{r.status}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
