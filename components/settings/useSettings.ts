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
        try { j = JSON.parse(txt); }
        catch {
          const dbg = await fetch("/api/settings/health").then(r=>r.json()).catch(()=>null);
          throw new Error(`GET /api/settings returned non-JSON. Health=${JSON.stringify(dbg)}`);
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
    set: (fn:(d:SettingsPayload)=>SettingsPayload)=> setDirty(p=>fn(structuredClone(p!))),
    save: async ()=>{
      const res = await fetch("/api/settings",{method:"PUT", headers:{'Content-Type':'application/json'}, body: JSON.stringify(dirty)});
      const txt = await res.text();
      if (!res.ok) throw new Error(txt);
      const j = JSON.parse(txt); setData(j); setDirty(j); return j;
    }
  };
}
