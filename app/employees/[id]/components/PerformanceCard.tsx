"use client";
import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { supabase } from "@/supabase/client";
type V={dogs_wtd:number};
export default function PerformanceCard({ employeeId }:{employeeId:number}) {
  const [v,setV]=useState<V|null>(null);
  useEffect(()=>{let on=true;(async()=>{
    const { data }=await supabase.from("v_employee_wtd").select("*").eq("employee_id",employeeId).maybeSingle();
    if(on) setV(data as V);
  })();return()=>{on=false};},[employeeId]);
  return (<Card><h3 className="text-lg font-semibold">Performance</h3>
    <div className="mt-3"><div className="text-2xl font-bold">{v?.dogs_wtd??0}</div>
    <div className="text-sm text-gray-600">Dogs this week</div></div></Card>);
}
