"use client";
import { useEffect, useState } from "react";
import type { SettingsPayload } from "@/lib/settings/types";
export function useSettings(){
  const [data,setData]=useState<SettingsPayload|null>(null);
  const [dirty,setDirty]=useState<SettingsPayload|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|undefined>();

  useEffect(()=>{
    (async()=>{
      try {
        const res = await fetch("/api/settings", { cache:"no-store" });
        const txt = await res.text();
        let j: any;
        try {
          j = JSON.parse(txt);
        } catch {
          const dbg = await fetch("/api/settings/debug", { cache:"no-store" });
          const dbgTxt = await dbg.text();
          throw new Error(`GET /api/settings returned non-JSON. Debug: ${dbg.status} ${dbgTxt.slice(0,500)}`);
        }
        setData(j); setDirty(j);
      } catch (e: any) {
        setError(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    })();
  },[]);

  return {
    loading, error,
    data: dirty,
    reset: ()=> setDirty(data),
    set: (fn:(d:SettingsPayload)=>SettingsPayload)=> setDirty(p=> p ? fn(structuredClone(p)) : p),
    save: async ()=>{
      if (!dirty) throw new Error("No settings loaded");
      const res = await fetch("/api/settings",{method:"PUT", headers:{'Content-Type':'application/json'}, body: JSON.stringify(dirty)});
      const txt = await res.text();
      if (!res.ok) throw new Error(`Save failed: ${res.status} ${txt.slice(0,200)}`);
      const j = JSON.parse(txt); setData(j); setDirty(j); return j;
    }
  };
}
