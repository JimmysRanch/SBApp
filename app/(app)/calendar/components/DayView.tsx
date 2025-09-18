"use client";
import CalendarEventCard, { type CalendarEvent } from "./CalendarEventCard";
import { startOfDay, endOfDay } from "../utils/date";

const dayHeaderFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

export default function DayView({ date, events, onSelectEvent }: { date: Date; events: CalendarEvent[]; onSelectEvent: (e: CalendarEvent)=>void }) {
  const list = events
    .filter((ev) => {
      const s = new Date(ev.start);
      const e = new Date(ev.end);
      return s <= endOfDay(date) && e >= startOfDay(date);
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const countLabel = `${list.length} ${list.length === 1 ? "event" : "events"}`;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-gray-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-800">{dayHeaderFormatter.format(date)}</h2>
        <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
          {countLabel}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {list.length === 0 ? (
          <p className="rounded border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
            Nothing scheduled for this day yet.
          </p>
        ) : (
          list.map((ev) => (
            <CalendarEventCard key={ev.id} event={ev} onClick={() => onSelectEvent(ev)} />
          ))
        )}
      </div>
    </div>
  );
}
