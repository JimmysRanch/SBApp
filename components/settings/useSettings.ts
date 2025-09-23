"use client";
import { useEffect, useState } from "react";
import { SettingsPayload } from "@/lib/settings/types";
export function useSettings(){
  const [data,setData] = useState<SettingsPayload|null>(null);
  const [dirty,setDirty] = useState<SettingsPayload|null>(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState<string|undefined>();
  useEffect(()=>{
    (async()=>{
      const res = await fetch("/api/settings", { credentials: "include" });
      const j = await res.json();
      setData(j); setDirty(j); setLoading(false);
    })().catch(e=>{ setError(String(e)); setLoading(false); });
  },[]);
  return {
    loading, error,
    data: dirty,
    reset: ()=> setDirty(data ? structuredClone(data) : data),
    set: (fn: (d:SettingsPayload)=>SettingsPayload)=> setDirty(prev => {
      if (!prev) return prev;
      const base = structuredClone(prev);
      return fn(base);
    }),
    save: async ()=>{
      if (!dirty) throw new Error("No settings loaded");
      const res = await fetch("/api/settings",{method:"PUT", headers:{'Content-Type':'application/json'}, body: JSON.stringify(dirty), credentials: "include"});
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      const j = await res.json(); setData(j); setDirty(j); return j;
    }
  };
}
