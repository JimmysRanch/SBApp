"use client";
import { useEffect, useMemo, useState } from "react";
import { useCalendarStore } from "./state/calendarStore";
import { addDays, endOfMonth, startOfMonth } from "./utils/date";
import { useCalendarEvents } from "./hooks/useCalendarEvents";
import CalendarGrid from "./components/CalendarGrid";
import WeekView from "./components/WeekView";
import DayView from "./components/DayView";
import EventDialog from "./components/EventDialog";
import DeleteConfirm from "./components/DeleteConfirm";
import type { CalendarEvent } from "./components/CalendarEventCard";

export default function CalendarPage() {
  const { view, selectedDate, setDate, setView, filters } = useCalendarStore();
  const range = useMemo(()=>{
    if (view==="month") return { from: startOfMonth(selectedDate), to: endOfMonth(selectedDate) };
    if (view==="week") return { from: addDays(selectedDate, -3), to: addDays(selectedDate, 3) };
    return { from: selectedDate, to: addDays(selectedDate, 1) };
  }, [view, selectedDate]);

  const { events, create, update, remove, isLoading } = useCalendarEvents(range.from, range.to, filters);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create"|"edit">("create");
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(()=>{ setSelected(null); }, [view, selectedDate]);

  function openCreate(d: Date) {
    setSelected({
      id: "new",
      title: "",
      type: "appointment",
      start: d.toISOString(),
      end: d.toISOString(),
      allDay: true,
    });
    setDialogMode("create");
    setDialogOpen(true);
  }

  function openEdit(ev: CalendarEvent) {
    setSelected(ev);
    setDialogMode("edit");
    setDialogOpen(true);
  }

  async function handleSubmit(payload: any) {
    if (!selected) return;
    if (dialogMode==="create") {
      await create(payload);
    } else {
      await update(selected.id, payload);
    }
    setDialogOpen(false);
  }

  async function handleDelete() {
    if (!selected) return;
    await remove(selected.id);
    setConfirmOpen(false);
    setDialogOpen(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="border px-2 py-1 rounded" onClick={()=>setDate(addDays(selectedDate, view==="month"?-30:view==="week"?-7:-1))}>Prev</button>
          <div className="font-semibold">{selectedDate.toDateString()}</div>
          <button className="border px-2 py-1 rounded" onClick={()=>setDate(addDays(selectedDate, view==="month"?30:view==="week"?7:1))}>Next</button>
        </div>
        <div className="flex items-center gap-2">
          <select className="border px-2 py-1 rounded" onChange={(e)=>setView(e.target.value as any)} value={view}>
            <option value="month">Month</option>
            <option value="week">Week</option>
            <option value="day">Day</option>
          </select>
          <button className="bg-black text-white px-3 py-1 rounded" onClick={()=>openCreate(selectedDate)}>New</button>
        </div>
      </div>

      {isLoading && <div className="text-sm text-gray-500">Loading…</div>}

      {view==="month" && (
        <CalendarGrid
          date={selectedDate}
          events={events}
          onSelectDay={(d)=>openCreate(d)}
          onSelectEvent={(e)=>openEdit(e)}
        />
      )}
      {view==="week" && <WeekView date={selectedDate} events={events} onSelectEvent={openEdit} />}
      {view==="day" && <DayView date={selectedDate} events={events} onSelectEvent={openEdit} />}

      <EventDialog
        open={dialogOpen}
        mode={dialogMode}
        initial={selected ? {
          id: selected.id,
          title: selected.title,
          type: selected.type,
          start: (selected.start instanceof Date ? selected.start : new Date(selected.start)).toISOString(),
          end: (selected.end instanceof Date ? selected.end : new Date(selected.end)).toISOString(),
          notes: selected.notes ?? "",
          allDay: selected.allDay ?? false,
        } : undefined}
        onClose={()=>setDialogOpen(false)}
        onSubmit={handleSubmit}
        onDelete={dialogMode==="edit" ? ()=>setConfirmOpen(true) : undefined}
      />
      <DeleteConfirm open={confirmOpen} onClose={()=>setConfirmOpen(false)} onConfirm={handleDelete} />
    </div>
  );
}
