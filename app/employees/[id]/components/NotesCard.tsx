"use client";
import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { supabase } from "@/supabase/client";
type Pref={notes:string|null};
export default function NotesCard({ employeeId }:{employeeId:number}) {
  const [notes,setNotes]=useState("");
  useEffect(()=>{let on=true;(async()=>{
    const { data }=await supabase.from("employee_prefs").select("notes").eq("employee_id",employeeId).maybeSingle();
    if(on) setNotes((data as Pref)?.notes ?? "");
  })();return()=>{on=false};},[employeeId]);
  return (<Card><h3 className="text-lg font-semibold">Notes</h3>
    <p className="mt-3 text-sm whitespace-pre-wrap">{notes || "No notes"}</p></Card>);
}
