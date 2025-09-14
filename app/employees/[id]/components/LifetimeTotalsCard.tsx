"use client";
import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { supabase } from "@/supabase/client";
export default function LifetimeTotalsCard({ employeeId }:{employeeId:number}) {
  const [count,setCount]=useState(0);
  useEffect(()=>{let on=true;(async()=>{
    const { count:c }=await supabase.from("appointments").select("*",{count:"exact",head:true})
      .eq("employee_id",employeeId).eq("status","completed");
    if(on) setCount(c||0);
  })();return()=>{on=false};},[employeeId]);
  return (<Card><h3 className="text-lg font-semibold">Lifetime Totals</h3>
    <div className="mt-3"><div className="text-2xl font-bold">{count}</div>
    <div className="text-sm text-gray-600">Completed grooms</div></div></Card>);
}
