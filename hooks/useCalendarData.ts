"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const STAFF_COLOR_CLASSES = [
  "bg-brand-bubble/20 text-white",
  "bg-emerald-400/20 text-emerald-950",
  "bg-sky-400/20 text-sky-950",
  "bg-amber-300/30 text-amber-900",
  "bg-violet-400/25 text-violet-950",
];

export interface Employee {
  id: string;
  name: string;
  initials?: string | null;
  colorClass?: string | null;
}
export interface Service  {
  id: string;
  name: string;
  minutes: number;
}
export interface Appt {
  id: string;
  employee_id: string;
  client_id?: string | null;
  pet_id?: string | null;
  service_id: string | null;
  service_size_id?: string | null;
  service?: string | null;
  price?: number | null;
  price_addons?: number | null;
  discount?: number | null;
  tax?: number | null;
  status?: string | null;
  notes?: string | null;
  start_time: string;
  end_time:   string;
}

type View = "day" | "week" | "month";

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d: Date)   { const x = new Date(d); x.setHours(23,59,59,999); return x; }
function startOfWeek(d: Date) {
  const dd = new Date(d); const dow = dd.getDay(); const mondayIndex = (dow + 6) % 7;
  dd.setDate(dd.getDate() - mondayIndex); dd.setHours(0,0,0,0); return dd;
}
function endOfWeek(d: Date)  { const s = startOfWeek(d); const e = new Date(s); e.setDate(s.getDate()+6); e.setHours(23,59,59,999); return e; }
function startOfMonth(d: Date){ return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date)  { return new Date(d.getFullYear(), d.getMonth()+1, 0, 23,59,59,999); }
function addMinutesISO(iso: string, mins: number) {
  const t = new Date(iso); t.setMinutes(t.getMinutes()+mins); return t.toISOString();
}

export function useCalendarData(currentDate: Date, view: View) {
  const [appointments, setAppointments] = useState<Appt[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // compute fetch window by view
  const [fromISO, toISO] = useMemo(() => {
    if (view === "day")  return [startOfDay(currentDate).toISOString(), endOfDay(currentDate).toISOString()];
    if (view === "week") return [startOfWeek(currentDate).toISOString(), endOfWeek(currentDate).toISOString()];
    return [startOfMonth(currentDate).toISOString(), endOfMonth(currentDate).toISOString()];
  }, [currentDate, view]);

  // initial lists
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        // employees
        const { data: emps, error: e1 } = await supabase
          .from("employees")
          .select("id,name,active")
          .order("name");
        if (e1) throw e1;
        const active = (emps || [])
          .filter((e: any) => e.active !== false)
          .map((e: any, index: number) => {
            const name: string = e.name || `#${e.id}`;
            const initials = name
              .split(/\s+/)
              .filter(Boolean)
              .map((part) => part[0]?.toUpperCase() ?? "")
              .join("")
              .slice(0, 2) || name.slice(0, 2).toUpperCase();
            const colorClass = STAFF_COLOR_CLASSES[index % STAFF_COLOR_CLASSES.length];
            return {
              id: String(e.id),
              name,
              initials,
              colorClass,
            };
          });
        // services
        const { data: svcs, error: e2 } = await supabase
          .from("services")
          .select("id,name,duration_min")
          .eq("active", true)
          .order("name");
        if (e2) throw e2;
        const svc = (svcs || []).map((s: any) => ({
          id: String(s.id),
          name: s.name,
          minutes: Number(s.duration_min ?? 60),
        }));
        if (!cancelled) { setEmployees(active); setServices(svc); }
      } catch (e:any) {
        if (!cancelled) setErr(e.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // range fetch via direct select (can be swapped to RPC calendar_range if preferred)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("appointments")
          .select(
            "id,employee_id,client_id,pet_id,service_id,service_size_id,price,price_addons,discount,tax,status,notes,start_time,end_time"
          )
          .lt("start_time", toISO)
          .gt("end_time", fromISO);
        if (error) throw error;
        const mapped: Appt[] = (data || []).map((a:any) => ({
          ...a,
          id: String(a.id),
          employee_id: a.employee_id != null ? String(a.employee_id) : "",
          service_id: a.service_id ? String(a.service_id) : null,
          service_size_id: a.service_size_id ? String(a.service_size_id) : null,
          start_time: a.start_time,
          end_time: a.end_time,
        }));
        if (!cancelled) { setAppointments(mapped); setErr(null); }
      } catch (e:any) {
        if (!cancelled) setErr(e.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [fromISO, toISO]);

  // realtime
  useEffect(() => {
    const ch = supabase
      .channel("rt-appointments")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, (payload) => {
        const n = payload.new as any;
        const o = payload.old as any;
        if (payload.eventType === "INSERT" && n) {
          const ap: Appt = { ...n, id: String(n.id), employee_id: String(n.employee_id), service_id: String(n.service_id) };
          setAppointments(prev => prev.find(x => x.id === ap.id) ? prev : [...prev, ap]);
        } else if (payload.eventType === "UPDATE" && n) {
          const ap: Appt = { ...n, id: String(n.id), employee_id: String(n.employee_id), service_id: String(n.service_id) };
          setAppointments(prev => prev.map(x => x.id === ap.id ? ap : x));
        } else if (payload.eventType === "DELETE" && o) {
          const id = String(o.id);
          setAppointments(prev => prev.filter(x => x.id !== id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // helpers
  async function checkConflict(employee_id: string, startISO: string, endISO: string, excludeId?: string) {
    const query = supabase
      .from("appointments")
      .select("id,start_time,end_time")
      .eq("employee_id", Number(employee_id))
      .lt("start_time", endISO)
      .gt("end_time", startISO);
    if (excludeId) query.neq("id", excludeId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).length > 0;
  }

  function durationForService(service_id: string) {
    const s = services.find(x => x.id === service_id);
    return s?.minutes ?? 60;
  }

  async function createAppt(input: { employee_id: string; service_id: string; start_time: string; notes?: string }) {
    const minutes = durationForService(input.service_id);
    const endISO = addMinutesISO(input.start_time, minutes);
    // conflict gate
    const conflict = await checkConflict(input.employee_id, input.start_time, endISO);
    if (conflict) return { error: "Time conflict for selected staff." };
    const { data, error } = await supabase
      .from("appointments")
      .insert([
        {
          employee_id: Number(input.employee_id),
          service_id: input.service_id,
          start_time: input.start_time,
          end_time: endISO,
          notes: input.notes ?? null,
        },
      ])
      .select()
      .single();
    if (error) return { error: error.message };
    const ap: Appt = {
      ...data,
      id: String(data.id),
      employee_id: data.employee_id != null ? String(data.employee_id) : "",
      service_id: data.service_id ? String(data.service_id) : null,
      service_size_id: data.service_size_id ? String(data.service_size_id) : null,
    };
    setAppointments(prev => [...prev, ap]);
    return { error: null };
  }

  async function updateAppt(id: string, input: { employee_id?: string; service_id?: string; start_time?: string; notes?: string }) {
    // recompute end_time if start_time or service_id changes
    const cur = appointments.find(a => a.id === id);
    const newStart = input.start_time ?? cur?.start_time!;
    const newServiceId = input.service_id ?? cur?.service_id!;
    const minutes = durationForService(newServiceId);
    const newEnd = addMinutesISO(newStart, minutes);
    const newEmp = input.employee_id ?? cur?.employee_id!;
    // conflict gate excluding current id
    const conflict = await checkConflict(newEmp, newStart, newEnd, id);
    if (conflict) return { error: "Time conflict for selected staff." };
    const { data, error } = await supabase
      .from("appointments")
      .update({
        employee_id: Number(newEmp),
        service_id: newServiceId,
        start_time: newStart,
        end_time: newEnd,
        notes: input.notes ?? cur?.notes ?? null
      })
      .eq("id", id)
      .select()
      .single();
    if (error) return { error: error.message };
    const ap: Appt = {
      ...data,
      id: String(data.id),
      employee_id: data.employee_id != null ? String(data.employee_id) : "",
      service_id: data.service_id ? String(data.service_id) : null,
      service_size_id: data.service_size_id ? String(data.service_size_id) : null,
    };
    setAppointments(prev => prev.map(x => x.id === ap.id ? ap : x));
    return { error: null };
  }

  async function deleteAppt(id: string) {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) return { error: error.message };
    setAppointments(prev => prev.filter(x => x.id !== id));
    return { error: null };
  }

  return { appointments, employees, services, loading, error: err, createAppt, updateAppt, deleteAppt };
}
