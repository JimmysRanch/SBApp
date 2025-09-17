"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase/client";
import { useEmployeeDetail } from "../EmployeeDetailClient";
import {
  addShiftAction,
  deleteShiftAction,
  requestTimeOffAction,
  updateTimeOffStatusAction,
} from "./actions";

type Shift = {
  id: number;
  starts_at: string;
  ends_at: string;
  note: string | null;
};

type TimeOff = {
  id: number;
  starts_at: string;
  ends_at: string;
  reason: string | null;
  status: string | null;
};

function startOfWeek(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  const day = next.getDay();
  next.setDate(next.getDate() - day);
  return next;
}

function formatRange(start: Date) {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;
}

function isoWeek(date: Date) {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export default function EmployeeSchedulePage() {
  const { employee, viewerCanEditStaff, pushToast } = useEmployeeDetail();

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [view, setView] = useState<"list" | "grid">("list");
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [timeOff, setTimeOff] = useState<TimeOff[]>([]);
  const [loading, setLoading] = useState(false);
  const [shiftForm, setShiftForm] = useState({ start: "", end: "", note: "" });
  const [timeOffForm, setTimeOffForm] = useState({ start: "", end: "", reason: "" });

  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 7);
    return end;
  }, [weekStart]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [shiftRes, timeOffRes] = await Promise.all([
      supabase
        .from("staff_shifts")
        .select("id,starts_at,ends_at,note")
        .eq("employee_id", employee.id)
        .gte("starts_at", weekStart.toISOString())
        .lt("starts_at", weekEnd.toISOString())
        .order("starts_at", { ascending: true }),
      supabase
        .from("staff_time_off")
        .select("id,starts_at,ends_at,reason,status")
        .eq("employee_id", employee.id)
        .order("starts_at", { ascending: true }),
    ]);

    if (!shiftRes.error && Array.isArray(shiftRes.data)) {
      setShifts(shiftRes.data as Shift[]);
    }
    if (!timeOffRes.error && Array.isArray(timeOffRes.data)) {
      setTimeOff(timeOffRes.data as TimeOff[]);
    }
    setLoading(false);
  }, [employee.id, weekEnd, weekStart]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddShift = async () => {
    if (!viewerCanEditStaff) {
      pushToast("You do not have permission to edit shifts", "error");
      return;
    }
    if (!shiftForm.start || !shiftForm.end) {
      pushToast("Start and end time required", "error");
      return;
    }
    const result = await addShiftAction(employee.id, {
      start: shiftForm.start,
      end: shiftForm.end,
      note: shiftForm.note,
    });
    if (!result.success) {
      pushToast(result.error ?? "Unable to add shift", "error");
      return;
    }
    pushToast("Shift added", "success");
    setShiftForm({ start: "", end: "", note: "" });
    loadData();
  };

  const handleDeleteShift = async (id: number) => {
    if (!viewerCanEditStaff) {
      pushToast("You do not have permission to delete shifts", "error");
      return;
    }
    const result = await deleteShiftAction(employee.id, id);
    if (!result.success) {
      pushToast(result.error ?? "Unable to delete shift", "error");
      return;
    }
    pushToast("Shift deleted", "success");
    loadData();
  };

  const handleTimeOff = async () => {
    if (!timeOffForm.start || !timeOffForm.end || !timeOffForm.reason.trim()) {
      pushToast("Complete the time off form", "error");
      return;
    }
    const result = await requestTimeOffAction(employee.id, {
      start: timeOffForm.start,
      end: timeOffForm.end,
      reason: timeOffForm.reason,
    });
    if (!result.success) {
      pushToast(result.error ?? "Unable to submit time off request", "error");
      return;
    }
    pushToast("Time off requested", "success");
    setTimeOffForm({ start: "", end: "", reason: "" });
    loadData();
  };

  const updateTimeOffStatus = async (id: number, status: "approved" | "denied") => {
    if (!viewerCanEditStaff) {
      pushToast("Only managers can update requests", "error");
      return;
    }
    const result = await updateTimeOffStatusAction(employee.id, id, status);
    if (!result.success) {
      pushToast(result.error ?? "Unable to update request", "error");
      return;
    }
    pushToast(`Request ${status}`, "success");
    loadData();
  };

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      const daily = shifts.filter((shift) => {
        const start = new Date(shift.starts_at);
        return start.getDate() === date.getDate() && start.getMonth() === date.getMonth();
      });
      return {
        date,
        shifts: daily,
      };
    });
  }, [shifts, weekStart]);

  const weekLabel = formatRange(weekStart);
  const calendarLink = `/calendar?staffId=${employee.id}&week=${isoWeek(weekStart)}`;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setWeekStart((prev) => {
              const next = new Date(prev);
              next.setDate(prev.getDate() - 7);
              return next;
            })}
            className="rounded-full border border-slate-300 px-3 py-1 text-sm font-semibold text-brand-blue hover:bg-slate-100"
          >
            ‹
          </button>
          <div className="text-lg font-semibold text-brand-navy">{weekLabel}</div>
          <button
            type="button"
            onClick={() => setWeekStart((prev) => {
              const next = new Date(prev);
              next.setDate(prev.getDate() + 7);
              return next;
            })}
            className="rounded-full border border-slate-300 px-3 py-1 text-sm font-semibold text-brand-blue hover:bg-slate-100"
          >
            ›
          </button>
          <div className="flex-1" />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setView("list")}
              className={`rounded-lg px-3 py-1 text-sm font-semibold ${
                view === "list"
                  ? "bg-brand-blue text-white"
                  : "border border-slate-300 text-brand-blue hover:bg-slate-100"
              }`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setView("grid")}
              className={`rounded-lg px-3 py-1 text-sm font-semibold ${
                view === "grid"
                  ? "bg-brand-blue text-white"
                  : "border border-slate-300 text-brand-blue hover:bg-slate-100"
              }`}
            >
              Grid
            </button>
          </div>
          <button
            type="button"
            onClick={() => window.open(calendarLink, "_blank")}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-brand-blue hover:bg-slate-100"
          >
            Open in Calendar
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-navy">Shifts</h2>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start</label>
            <input
              type="datetime-local"
              value={shiftForm.start}
              onChange={(event) => setShiftForm((prev) => ({ ...prev, start: event.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">End</label>
            <input
              type="datetime-local"
              value={shiftForm.end}
              onChange={(event) => setShiftForm((prev) => ({ ...prev, end: event.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Note</label>
            <input
              type="text"
              value={shiftForm.note}
              onChange={(event) => setShiftForm((prev) => ({ ...prev, note: event.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleAddShift}
            className="rounded-lg bg-brand-hotpink px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-hotpink/90"
          >
            Add Shift
          </button>
        </div>

        <div className="mt-6">
          {loading ? (
            <p className="text-sm text-slate-500">Loading shifts…</p>
          ) : shifts.length === 0 ? (
            <p className="text-sm text-slate-500">No shifts scheduled.</p>
          ) : view === "list" ? (
            <ul className="space-y-3">
              {shifts.map((shift) => (
                <li
                  key={shift.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div>
                    <div className="font-semibold text-brand-navy">
                      {new Date(shift.starts_at).toLocaleString()} → {new Date(shift.ends_at).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </div>
                    {shift.note && <div className="text-sm text-slate-500">{shift.note}</div>}
                  </div>
                  {viewerCanEditStaff && (
                    <button
                      type="button"
                      onClick={() => handleDeleteShift(shift.id)}
                      className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {days.map((day) => (
                <div key={day.date.toISOString()} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-brand-navy">
                    {day.date.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                  </div>
                  <div className="mt-2 space-y-2 text-sm">
                    {day.shifts.length === 0 && <p className="text-slate-400">No shifts</p>}
                    {day.shifts.map((shift) => (
                      <div key={shift.id} className="rounded-lg bg-white p-3 shadow">
                        <div className="font-semibold text-brand-navy">
                          {new Date(shift.starts_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} –
                          {new Date(shift.ends_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        </div>
                        {shift.note && <div className="text-xs text-slate-500">{shift.note}</div>}
                        {viewerCanEditStaff && (
                          <button
                            type="button"
                            onClick={() => handleDeleteShift(shift.id)}
                            className="mt-2 text-xs font-semibold text-rose-600 hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-navy">Time Off</h2>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start</label>
            <input
              type="date"
              value={timeOffForm.start}
              onChange={(event) => setTimeOffForm((prev) => ({ ...prev, start: event.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">End</label>
            <input
              type="date"
              value={timeOffForm.end}
              onChange={(event) => setTimeOffForm((prev) => ({ ...prev, end: event.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reason</label>
            <input
              type="text"
              value={timeOffForm.reason}
              onChange={(event) => setTimeOffForm((prev) => ({ ...prev, reason: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleTimeOff}
            className="rounded-lg bg-brand-hotpink px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-hotpink/90"
          >
            Request
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {loading ? (
            <p className="text-sm text-slate-500">Loading requests…</p>
          ) : timeOff.length === 0 ? (
            <p className="text-sm text-slate-500">No time off requests.</p>
          ) : (
            timeOff.map((request) => {
              const status = request.status ?? "pending";
              return (
                <div
                  key={request.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div>
                    <div className="font-semibold text-brand-navy">
                      {new Date(request.starts_at).toLocaleDateString()} – {new Date(request.ends_at).toLocaleDateString()}
                    </div>
                    {request.reason && <div className="text-sm text-slate-500">{request.reason}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        status === "approved"
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                          : status === "denied"
                          ? "border border-rose-200 bg-rose-50 text-rose-600"
                          : "border border-amber-200 bg-amber-50 text-amber-600"
                      }`}
                    >
                      {status}
                    </span>
                    {viewerCanEditStaff && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => updateTimeOffStatus(request.id, "approved")}
                          className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => updateTimeOffStatus(request.id, "denied")}
                          className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          Deny
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
