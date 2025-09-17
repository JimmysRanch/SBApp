"use client";

import { useEffect, useState } from "react";
import type { Appt, Employee, Service } from "@/hooks/useCalendarData";

interface Props {
  open: boolean;
  initial: Partial<Appt> | null; // null=new
  employees: Employee[];
  services: Service[];
  onClose: () => void;
  onCreate: (data: { employee_id: string; service_id: string; start_time: string; notes?: string }) => Promise<{ error: string | null }>;
  onUpdate: (id: string, data: { employee_id?: string; service_id?: string; start_time?: string; notes?: string }) => Promise<{ error: string | null }>;
  onDeleteRequest: (appt: Partial<Appt>) => void;
}

export default function AppointmentDrawer({ open, initial, employees, services, onClose, onCreate, onUpdate, onDeleteRequest }: Props) {
  const isEdit = !!initial?.id;
  const [startLocal, setStartLocal] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const base = initial?.start_time ? new Date(initial.start_time) : new Date();
    const local = new Date(base.getTime() - base.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setStartLocal(local);
    setEmployeeId(initial?.employee_id || employees[0]?.id || "");
    setServiceId(initial?.service_id || services[0]?.id || "");
    setNotes(initial?.notes || "");
    setErr(null);
  }, [initial, employees, services]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!startLocal || !employeeId || !serviceId) { setErr("Fill all fields"); return; }
    const startISO = new Date(startLocal).toISOString();
    const payload = { employee_id: employeeId, service_id: serviceId, start_time: startISO, notes: notes || undefined };
    const res = isEdit && initial?.id ? await onUpdate(String(initial.id), payload) : await onCreate(payload);
    if (res.error) setErr(res.error); else onClose();
  }

  return (
    <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`} style={{ zIndex: 1000 }}>
      <div className="absolute inset-0 bg-black/30 -z-10" onClick={onClose} />
      <div className="h-full flex flex-col">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">{isEdit ? "Edit Appointment" : "New Appointment"}</h2>
          <button onClick={onClose} className="text-xl font-bold" aria-label="Close">&times;</button>
        </div>
        <form onSubmit={submit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date & Time</label>
            <input type="datetime-local" value={startLocal} onChange={(e)=>setStartLocal(e.target.value)} required className="w-full border rounded px-3 py-1" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Staff</label>
            <select value={employeeId} onChange={(e)=>setEmployeeId(e.target.value)} required className="w-full border rounded px-3 py-1">
              {employees.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Service</label>
            <select value={serviceId} onChange={(e)=>setServiceId(e.target.value)} required className="w-full border rounded px-3 py-1">
              {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.minutes}m)</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <textarea value={notes} onChange={(e)=>setNotes(e.target.value)} className="w-full border rounded px-3 py-1" rows={3} />
          </div>
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <div className="flex justify-between items-center pt-2">
            {isEdit ? (
              <button type="button" onClick={() => onDeleteRequest(initial!)} className="text-red-600 text-sm">Delete Appointment</button>
            ) : <span />}
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              {isEdit ? "Save Changes" : "Create Appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
