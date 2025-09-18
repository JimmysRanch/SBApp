"use client";
export interface CalendarEvent {
  id: string;
  title: string;
  start: string | Date;
  end: string | Date;
  type: "appointment" | "shift" | "timeOff";
  notes?: string | null;
  staffId?: number | null;
  petId?: string | null;
  allDay?: boolean;
}
export default function CalendarEventCard({ event, onClick }: { event: CalendarEvent; onClick?: () => void }) {
  const colorClasses =
    event.type === "appointment"
      ? "border-l-blue-500/80 bg-blue-50 text-blue-900 hover:border-blue-400/90"
      : event.type === "shift"
        ? "border-l-emerald-500/80 bg-emerald-50 text-emerald-900 hover:border-emerald-400/90"
        : "border-l-amber-500/80 bg-amber-50 text-amber-900 hover:border-amber-400/90";

  const s = event.start instanceof Date ? event.start : new Date(event.start);
  const e = event.end instanceof Date ? event.end : new Date(event.end);
  const valid = !Number.isNaN(s.valueOf()) && !Number.isNaN(e.valueOf());
  const allDayTime =
    event.allDay ||
    (valid && s.getHours() === 0 && s.getMinutes() === 0 && e.getHours() === 0 && e.getMinutes() === 0);
  const time = valid
    ? allDayTime
      ? "All day"
      : `${s.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} – ${e.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })}`
    : "";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-md border border-transparent border-l-4 px-3 py-2 text-left text-sm shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${colorClasses}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-semibold" title={event.title}>{event.title}</span>
        {time && <span className="shrink-0 text-xs font-medium opacity-80">{time}</span>}
      </div>
      {event.notes && event.notes.trim() && (
        <p className="mt-1 truncate text-xs opacity-80" title={event.notes ?? undefined}>
          {event.notes}
        </p>
      )}
    </button>
  );
}
