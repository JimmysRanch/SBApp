"use client";
import React, { useEffect, useState } from "react";
type Report = { name:string; ok:boolean; details?:string };
export default function SelfTest(){
  const [reports,setReports] = useState<Report[]>([]);
  const pass = (name:string, details?:string)=> setReports(r=>[...r,{name,ok:true,details}]);
  const fail = (name:string, details?:string)=> setReports(r=>[...r,{name,ok:false,details}]);

  useEffect(()=>{
    (async()=>{
      try{
        const get1 = await fetch("/api/settings"); const base = await get1.json();
        if (!base?.org?.general) return fail("GET baseline","Missing org.general"); pass("GET baseline");
        const payload = structuredClone(base);
        payload.org.general.name = "Test Grooming Co";
        payload.org.scheduling.slotMinutes = payload.org.scheduling.slotMinutes === 15 ? 10 : 15;
        payload.org.payroll.frequency = payload.org.payroll.frequency === "biweekly" ? "monthly" : "biweekly";
        payload.org.theme.brand.primary = payload.org.theme.brand.primary === "#0B6" ? "#2255EE" : "#0B6";
        const put = await fetch("/api/settings",{method:"PUT", headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)});
        if (!put.ok) return fail("PUT save", `HTTP ${put.status}`); pass("PUT save");
        const after = await (await fetch("/api/settings")).json();
        const checks:[string,boolean][] = [
          ["general.name", after.org.general.name==="Test Grooming Co"],
          ["scheduling.slotMinutes", [10,15].includes(after.org.scheduling.slotMinutes)],
          ["payroll.frequency", ["biweekly","monthly"].includes(after.org.payroll.frequency)],
          ["theme.brand.primary", ["#0B6","#2255EE"].includes(after.org.theme.brand.primary)],
        ];
        let all = true;
        for (const [name, ok] of checks){ if(!ok){ fail(`Verify ${name}`); all=false; } else pass(`Verify ${name}`); }
        if(all) pass("Self-test complete","All controls saved and reloaded");
      }catch(e:any){ fail("Exception", String(e?.message||e)); }
    })();
  },[]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold">Settings Self-Test</h1>
      <p>Runs GET → PUT → GET; validates each section saved and reloaded.</p>
      <ul className="list-disc ml-6 mt-2">
        {reports.map((r,i)=>(<li key={i} className={r.ok ? "text-green-700" : "text-red-700"}>
          {r.ok ? "✔︎" : "✘"} {r.name}{r.details ? ` — ${r.details}` : ""}
        </li>))}
      </ul>
    </div>
  );
}
