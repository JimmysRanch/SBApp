"use client";
export interface CalendarEvent {
  id: string;
  title: string;
  start: string | Date;
  end: string | Date;
  type: "appointment" | "shift" | "timeOff";
  notes?: string | null;
  staffId?: string | null;
  petId?: string | null;
  allDay?: boolean;
}
export default function CalendarEventCard({ event, onClick }: { event: CalendarEvent; onClick?: () => void }) {
  const colorClasses =
    event.type === "appointment"
      ? "bg-blue-100 border-blue-400 text-blue-800"
      : event.type === "shift"
        ? "bg-green-100 border-green-400 text-green-800"
        : "bg-yellow-100 border-yellow-400 text-yellow-800";

  const s = event.start instanceof Date ? event.start : new Date(event.start);
  const e = event.end instanceof Date ? event.end : new Date(event.end);
  const valid = !Number.isNaN(s.valueOf()) && !Number.isNaN(e.valueOf());
  const allDay = valid && s.getHours()===0 && s.getMinutes()===0 && e.getHours()===0 && e.getMinutes()===0;
  const time = valid ? (allDay ? "All Day" : `${s.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} – ${e.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`) : "";

  return (
    <div className={`border rounded px-2 py-1 text-sm cursor-pointer ${colorClasses}`} onClick={onClick} draggable={false}>
      <div className="font-medium line-clamp-1">{event.title}</div>
      {time && <div className="text-xs">{time}</div>}
    </div>
  );
}
