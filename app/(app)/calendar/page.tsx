"use client";

import { useState, useMemo } from "react";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import CalendarToolbar from "@/components/CalendarToolbar";
import CalendarGrid from "@/components/CalendarGrid";
import { DayGrid } from "@/components/CalendarDayGridDnD";
import AppointmentDrawer from "@/components/AppointmentDrawer";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import { useCalendarData, Appt } from "@/hooks/useCalendarData";

type View = "day" | "week" | "month";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>("week");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<Partial<Appt> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Partial<Appt> | null>(null);

  const { appointments, employees, services, loading, error, createAppt, updateAppt, deleteAppt } =
    useCalendarData(currentDate, view);

  // toolbar nav
  const goToday = () => setCurrentDate(new Date());
  const goPrev = () => {
    const d = new Date(currentDate);
    if (view === "day") d.setDate(d.getDate()-1);
    else if (view === "week") d.setDate(d.getDate()-7);
    else d.setMonth(d.getMonth()-1);
    setCurrentDate(d);
  };
  const goNext = () => {
    const d = new Date(currentDate);
    if (view === "day") d.setDate(d.getDate()+1);
    else if (view === "week") d.setDate(d.getDate()+7);
    else d.setMonth(d.getMonth()+1);
    setCurrentDate(d);
  };

  // DnD handler (only used in day view grid)
  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;
    const [newEmpId, newHourStr] = destination.droppableId.split("-");
    const appt = appointments.find(a => a.id === draggableId);
    if (!appt) return;
    const newStart = new Date(appt.start_time);
    newStart.setHours(Number(newHourStr), 0, 0, 0);
    const res = await updateAppt(appt.id, { employee_id: newEmpId, start_time: newStart.toISOString() });
    if (res.error) alert(res.error);
  };

  // open drawer for new
  const openNew = () => {
    const base = new Date(currentDate);
    base.setHours(9,0,0,0);
    setSelected({ employee_id: employees[0]?.id, service_id: services[0]?.id, start_time: base.toISOString() } as Partial<Appt>);
    setDrawerOpen(true);
  };

  // simple derived event list for Part 2 CalendarGrid (Week/Month simple lists)
  const events = useMemo(() => {
    return appointments.map(a => ({
      id: Number(a.id),
      title: `${services.find(s => s.id === a.service_id)?.name || "Service"} (${employees.find(e => e.id === a.employee_id)?.name || "Staff"})`,
      start: new Date(a.start_time),
      end: new Date(a.end_time),
      type: "appointment" as const,
    }));
  }, [appointments, employees, services]);

  return (
    <div className="bg-white rounded-md p-4 shadow-sm">
      <div className="mb-3 flex justify-between">
        <CalendarToolbar currentDate={currentDate} view={view} onViewChange={setView} onPrev={goPrev} onNext={goNext} onToday={goToday} />
        <button onClick={openNew} className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">New Appointment</button>
      </div>

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {/* Day view gets DnD grid; Week/Month use Part 2 simple grids */}
      {view === "day" ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <DayGrid
            date={currentDate}
            employees={employees}
            appointments={appointments}
            services={services}
            onApptClick={(a) => { setSelected(a); setDrawerOpen(true); }}
          />
        </DragDropContext>
      ) : (
        <CalendarGrid currentDate={currentDate} view={view} events={events} onEventClick={(ev)=> {
          const a = appointments.find(x => x.id === String(ev.id));
          if (a) { setSelected(a); setDrawerOpen(true); }
        }} />
      )}

      <AppointmentDrawer
        open={drawerOpen}
        initial={selected}
        employees={employees}
        services={services}
        onClose={() => setDrawerOpen(false)}
        onCreate={async (p) => {
          const res = await createAppt(p);
          return { error: res.error };
        }}
        onUpdate={async (id, p) => {
          const res = await updateAppt(id, p);
          return { error: res.error };
        }}
        onDeleteRequest={(a) => { setDrawerOpen(false); setConfirmDelete(a); }}
      />

      <ConfirmDeleteModal
        open={!!confirmDelete}
        itemName="this appointment"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (confirmDelete?.id) {
            const res = await deleteAppt(String(confirmDelete.id));
            if (res.error) alert(res.error);
          }
          setConfirmDelete(null);
        }}
      />
    </div>
  );
}
