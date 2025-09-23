"use client";
import React from "react";
const SECTIONS = ["General","Scheduling","Payroll","Theme"] as const;
export type Section = typeof SECTIONS[number];
export function SettingsNav({current, onSelect}:{current:Section; onSelect:(s:Section)=>void}){
  return (
    <aside className="w-[260px] border-r border-gray-100 p-3">
      {SECTIONS.map(s=>(
        <button key={s} onClick={()=>onSelect(s)}
          className={`block w-full text-left px-3 py-2 mb-1.5 rounded-md border ${current===s ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"}`}>
          {s}
        </button>
      ))}
    </aside>
  );
}
