"use client";
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initial?: { id?: string; title?: string; type?: "appointment"|"shift"|"timeOff"; start?: string; end?: string; notes?: string|null; allDay?: boolean };
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
};

export default function EventDialog({ open, mode, initial, onClose, onSubmit, onDelete }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState<"appointment"|"shift"|"timeOff">(initial?.type ?? "appointment");
  const [start, setStart] = useState(initial?.start ?? new Date().toISOString().slice(0,16));
  const [end, setEnd] = useState(initial?.end ?? new Date().toISOString().slice(0,16));
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [allDay, setAllDay] = useState(initial?.allDay ?? false);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setType(initial?.type ?? "appointment");
      setStart((initial?.start ?? new Date().toISOString()).slice(0,16));
      setEnd((initial?.end ?? new Date().toISOString()).slice(0,16));
      setNotes(initial?.notes ?? "");
      setAllDay(initial?.allDay ?? false);
    }
  }, [open, initial]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-full max-w-md rounded shadow p-4 space-y-3">
        <div className="text-lg font-semibold">{mode === "create" ? "New Event" : "Edit Event"}</div>
        <label className="block text-sm">Title
          <input className="mt-1 w-full border rounded px-2 py-1" value={title} onChange={(e)=>setTitle(e.target.value)} />
        </label>
        <label className="block text-sm">Type
          <select className="mt-1 w-full border rounded px-2 py-1" value={type} onChange={(e)=>setType(e.target.value as any)}>
            <option value="appointment">Appointment</option>
            <option value="shift">Shift</option>
            <option value="timeOff">Time Off</option>
          </select>
        </label>
        <label className="block text-sm">
          <span>All day</span>
          <input type="checkbox" className="ml-2" checked={allDay} onChange={(e)=>setAllDay(e.target.checked)} />
        </label>
        <div className="grid grid-cols-2 gap-2">
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

        <div className="flex justify-between pt-2">
          {mode === "edit" && onDelete ? (
            <button className="text-red-600" onClick={()=>onDelete()}>Delete</button>
          ) : <div />}
          <div className="space-x-2">
            <button className="border px-3 py-1 rounded" onClick={onClose}>Cancel</button>
            <button
              className="bg-black text-white px-3 py-1 rounded"
              onClick={() => onSubmit({ title, type, start: new Date(start), end: new Date(end), notes, allDay })}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
