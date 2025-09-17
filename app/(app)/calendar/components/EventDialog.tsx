"use client";
import { useEffect, useRef, useState } from "react";

type Option = { id: string; label: string };

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initial?: {
    id?: string;
    title?: string;
    type?: "appointment"|"shift"|"timeOff";
    start?: string;
    end?: string;
    notes?: string|null;
    allDay?: boolean;
    staffId?: number | null;
    petId?: string | null;
  };
  staffOptions?: Option[];
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
};

function toInputValue(v?: string) {
  if (!v) return new Date().toISOString().slice(0, 16);
  const date = new Date(v);
  if (Number.isNaN(date.valueOf())) return new Date().toISOString().slice(0,16);
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0,16);
}

export default function EventDialog({ open, mode, initial, staffOptions = [], onClose, onSubmit, onDelete }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState<"appointment"|"shift"|"timeOff">(initial?.type ?? "appointment");
  const [start, setStart] = useState<string>(toInputValue(initial?.start));
  const [end, setEnd] = useState<string>(toInputValue(initial?.end ?? initial?.start));
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [allDay, setAllDay] = useState(initial?.allDay ?? false);
  const [staffId, setStaffId] = useState(
    initial?.staffId != null ? String(initial.staffId) : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setType(initial?.type ?? "appointment");
      setStart(toInputValue(initial?.start));
      setEnd(toInputValue(initial?.end ?? initial?.start));
      setNotes(initial?.notes ?? "");
      setAllDay(initial?.allDay ?? false);
      setStaffId(initial?.staffId != null ? String(initial.staffId) : "");
      setError(null);
      setSaving(false);
      setTimeout(() => firstFieldRef.current?.focus(), 0);
    }
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const hasStaff = staffOptions.length > 0;

  const handleSave = async () => {
    setError(null);
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.valueOf()) || Number.isNaN(endDate.valueOf())) {
      setError("Please provide valid start and end times.");
      return;
    }
    if (startDate > endDate) {
      setError("Start must be before end.");
      return;
    }
    const normalizedStart = new Date(startDate);
    const normalizedEnd = new Date(endDate);
    if (allDay) {
      normalizedStart.setHours(0,0,0,0);
      normalizedEnd.setHours(23,59,59,999);
    }
    setSaving(true);
    try {
      const trimmedStaff = staffId.trim();
      const parsedStaffId = trimmedStaff ? Number(trimmedStaff) : null;
      const normalizedStaffId = parsedStaffId !== null && Number.isFinite(parsedStaffId)
        ? parsedStaffId
        : null;
      await onSubmit({
        title: title.trim(),
        type,
        start: normalizedStart,
        end: normalizedEnd,
        notes: notes.trim() ? notes.trim() : null,
        allDay,
        staffId: normalizedStaffId,
      });
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Could not save event.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded shadow p-4 space-y-3" onClick={(e)=>e.stopPropagation()}>
        <div className="text-lg font-semibold">{mode === "create" ? "New Event" : "Edit Event"}</div>
        <label className="block text-sm">Title
          <input
            ref={firstFieldRef}
            className="mt-1 w-full border rounded px-2 py-1"
            value={title}
            onChange={(e)=>setTitle(e.target.value)}
          />
        </label>
        <label className="block text-sm">Type
          <select className="mt-1 w-full border rounded px-2 py-1" value={type} onChange={(e)=>setType(e.target.value as any)}>
            <option value="appointment">Appointment</option>
            <option value="shift">Shift</option>
            <option value="timeOff">Time Off</option>
          </select>
        </label>
        {hasStaff && (
          <label className="block text-sm">Staff
            <select className="mt-1 w-full border rounded px-2 py-1" value={staffId} onChange={(e)=>setStaffId(e.target.value)}>
              <option value="">Unassigned</option>
              {staffOptions.map((opt)=>(
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </label>
        )}
        <label className="inline-flex items-center text-sm gap-2">
          <input type="checkbox" checked={allDay} onChange={(e)=>setAllDay(e.target.checked)} />
          <span>All day</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="block text-sm">Start
            <input type="datetime-local" className="mt-1 w-full border rounded px-2 py-1" value={start} onChange={(e)=>setStart(e.target.value)} />
          </label>
          <label className="block text-sm">End
            <input type="datetime-local" className="mt-1 w-full border rounded px-2 py-1" value={end} onChange={(e)=>setEnd(e.target.value)} />
          </label>
        </div>
        <label className="block text-sm">Notes
          <textarea className="mt-1 w-full border rounded px-2 py-1" rows={3} value={notes} onChange={(e)=>setNotes(e.target.value)} />
        </label>
        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex justify-between pt-2">
          {mode === "edit" && onDelete ? (
            <button className="text-red-600" onClick={()=>onDelete()} disabled={saving}>Delete</button>
          ) : <div />}
          <div className="space-x-2">
            <button className="border px-3 py-1 rounded" onClick={onClose} disabled={saving}>Cancel</button>
            <button
              className="bg-black text-white px-3 py-1 rounded disabled:opacity-60"
              onClick={handleSave}
              disabled={saving || !title.trim()}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
