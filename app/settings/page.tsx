"use client";
import React, { useState } from "react";
import { SettingsNav, Section } from "@/components/settings/SettingsNav";
import { useSettings } from "@/components/settings/useSettings";
import { Field } from "@/components/settings/Field";

export default function SettingsPage(){
  const {loading, data, set, save, reset, error} = useSettings();
  const [section, setSection] = useState<Section>("General");
  const canSave = !loading && !!data;

  const Header = (
    <header className="flex justify-between p-4 border-b border-gray-100">
      <input placeholder="Search settings" aria-label="Search settings" className="w-[360px] p-2 border rounded" />
      <div className="flex gap-2">
        <button onClick={reset} disabled={!canSave} className="px-3 py-2 border rounded">Reset</button>
        <button onClick={async()=>{ await save(); alert("Saved"); }} disabled={!canSave} className="px-3 py-2 border rounded">Save</button>
        <button onClick={()=>window.open("/settings/self-test","_blank")} className="px-3 py-2 border rounded">Run Self-Test</button>
      </div>
    </header>
  );

  function renderGeneral(){
    if(!data) return null;
    return (
      <>
        <Field label="Business name" hint="Shown on receipts and messages">
          {({ id, hintId }) => (
            <input
              id={id}
              aria-describedby={hintId}
              className="border rounded p-2 w-full"
              value={data.org.general.name}
              onChange={e=>set(d=>{d.org.general.name=e.target.value; return d;})}
            />
          )}
        </Field>
        <Field label="Timezone">
          {({ id }) => (
            <input
              id={id}
              className="border rounded p-2 w-full"
              value={data.org.general.timezone}
              onChange={e=>set(d=>{d.org.general.timezone=e.target.value; return d;})}
            />
          )}
        </Field>
        <Field label="Week start">
          {({ id }) => (
            <select
              id={id}
              className="border rounded p-2"
              value={data.org.general.weekStart}
              onChange={e=>set(d=>{d.org.general.weekStart=e.target.value as any; return d;})}
            >
              <option value="Mon">Monday</option><option value="Sun">Sunday</option>
            </select>
          )}
        </Field>
      </>
    );
  }
  function renderScheduling(){
    if(!data) return null;
    return (
      <>
        <Field label="Slot minutes">
          {({ id }) => (
            <select
              id={id}
              className="border rounded p-2"
              value={data.org.scheduling.slotMinutes}
              onChange={e=>set(d=>{d.org.scheduling.slotMinutes=Number(e.target.value) as any; return d;})}
            >
              {[5,10,15,20,30].map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          )}
        </Field>
        <Field label="Overlap policy">
          {({ id }) => (
            <select
              id={id}
              className="border rounded p-2"
              value={data.org.scheduling.overlap}
              onChange={e=>set(d=>{d.org.scheduling.overlap=e.target.value as any; return d;})}
            >
              <option value="disallow">Disallow</option><option value="warn">Warn</option><option value="allow">Allow</option>
            </select>
          )}
        </Field>
        <Field label="Auto-assign">
          {({ id }) => (
            <select
              id={id}
              className="border rounded p-2"
              value={data.org.scheduling.autoAssign}
              onChange={e=>set(d=>{d.org.scheduling.autoAssign=e.target.value as any; return d;})}
            >
              <option value="revenue-balance">Revenue balance</option>
              <option value="round-robin">Round robin</option>
              <option value="preference">Preference</option>
            </select>
          )}
        </Field>
      </>
    );
  }
  function renderPayroll(){
    if(!data) return null;
    return (
      <>
        <Field label="Frequency">
          {({ id }) => (
            <select
              id={id}
              className="border rounded p-2"
              value={data.org.payroll.frequency}
              onChange={e=>set(d=>{d.org.payroll.frequency=e.target.value as any; return d;})}
            >
              {["weekly","biweekly","semimonthly","monthly"].map(v=><option key={v} value={v}>{v}</option>)}
            </select>
          )}
        </Field>
        <Field label="Payday">
          {({ id }) => (
            <select
              id={id}
              className="border rounded p-2"
              value={data.org.payroll.payday}
              onChange={e=>set(d=>{d.org.payroll.payday=e.target.value as any; return d;})}
            >
              {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(v=><option key={v} value={v}>{v}</option>)}
            </select>
          )}
        </Field>
        <Field label="Period start">
          {({ id }) => (
            <select
              id={id}
              className="border rounded p-2"
              value={data.org.payroll.periodStart}
              onChange={e=>set(d=>{d.org.payroll.periodStart=e.target.value as any; return d;})}
            >
              {["Monday","Sunday"].map(v=><option key={v} value={v}>{v}</option>)}
            </select>
          )}
        </Field>
      </>
    );
  }
  function renderTheme(){
    if(!data) return null;
    return (
      <>
        <Field label="Theme mode">
          {({ id }) => (
            <select
              id={id}
              className="border rounded p-2"
              value={data.org.theme.mode}
              onChange={e=>set(d=>{d.org.theme.mode=e.target.value as any; return d;})}
            >
              {["light","dark","auto"].map(v=><option key={v} value={v}>{v}</option>)}
            </select>
          )}
        </Field>
        <Field label="Motion">
          {({ id }) => (
            <select
              id={id}
              className="border rounded p-2"
              value={data.org.theme.motion}
              onChange={e=>set(d=>{d.org.theme.motion=e.target.value as any; return d;})}
            >
              {["standard","reduced"].map(v=><option key={v} value={v}>{v}</option>)}
            </select>
          )}
        </Field>
        <Field label="Background">
          {({ id }) => (
            <select
              id={id}
              className="border rounded p-2"
              value={data.org.theme.background}
              onChange={e=>set(d=>{d.org.theme.background=e.target.value as any; return d;})}
            >
              {["static","parallax","liquid"].map(v=><option key={v} value={v}>{v}</option>)}
            </select>
          )}
        </Field>
        <Field label="Brand colors">
          {({ id, labelId }) => {
            const accentId = `${id}-accent`;
            return (
              <div className="flex gap-2" role="group" aria-labelledby={labelId}>
                <label className="text-sm" htmlFor={id}>
                  Primary
                  <input
                    id={id}
                    className="border rounded p-2 ml-1"
                    type="text"
                    value={data.org.theme.brand.primary}
                    onChange={e=>set(d=>{d.org.theme.brand.primary=e.target.value; return d;})}
                  />
                </label>
                <label className="text-sm" htmlFor={accentId}>
                  Accent
                  <input
                    id={accentId}
                    className="border rounded p-2 ml-1"
                    type="text"
                    value={data.org.theme.brand.accent}
                    onChange={e=>set(d=>{d.org.theme.brand.accent=e.target.value; return d;})}
                  />
                </label>
              </div>
            );
          }}
        </Field>
      </>
    );
  }

  let body: React.ReactNode = null;
  switch(section){
    case "General": body = renderGeneral(); break;
    case "Scheduling": body = renderScheduling(); break;
    case "Payroll": body = renderPayroll(); break;
    case "Theme": body = renderTheme(); break;
  }

  return (
    <div className="flex min-h-screen">
      <SettingsNav current={section} onSelect={setSection} />
      <main className="flex-1 flex flex-col">
        {Header}
        <div className="p-4 max-w-[900px]">
          {error && <div className="text-red-600 mb-2">{error}</div>}
          {loading ? <div>Loading…</div> : body}
        </div>
      </main>
    </div>
  );
}
