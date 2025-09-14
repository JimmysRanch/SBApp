"use client";
import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { supabase } from "@/supabase/client";
type V={dogs_today:number;hours_today:number;completed_today:number};
export default function TodayWorkload({ employeeId }:{employeeId:number}) {
  const [v,setV]=useState<V|null>(null);
  useEffect(()=>{let on=true;(async()=>{
    const { data } = await supabase.from("v_employee_today_workload").select("*").eq("employee_id",employeeId).maybeSingle();
    if(on) setV(data as V);
  })();return()=>{on=false};},[employeeId]);
  const dogs=v?.dogs_today??0, done=v?.completed_today??0, pct=dogs?Math.round(done/dogs*100):0;
  return (
    <Card>
      <h3 className="text-lg font-semibold">Today’s Workload</h3>
      <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
        <div>
          <div className="text-2xl font-bold">{dogs}</div>
          <div className="text-gray-600">Dogs</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{(v?.hours_today??0).toFixed(2)}</div>
          <div className="text-gray-600">Hours</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{pct}%</div>
          <div className="text-gray-600">Done</div>
        </div>
      </div>
    </Card>
  );
}
