"use client";
import { addDays, startOfDay, endOfDay, startOfMonth, startOfWeek, sameDay } from "../utils/date";
import CalendarEventCard, { type CalendarEvent } from "./CalendarEventCard";

type Props = {
  date: Date;
  events: CalendarEvent[];
  onSelectDay: (d: Date) => void;
  onSelectEvent: (e: CalendarEvent) => void;
  onShowOverflow: (d: Date) => void;
};

function eventsForDay(day: Date, list: CalendarEvent[]) {
  const start = startOfDay(day);
  const end = endOfDay(day);
  return list
    .filter((ev) => {
      const s = new Date(ev.start);
      const e = new Date(ev.end);
      return s <= end && e >= start;
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

export default function CalendarGrid({ date, events, onSelectDay, onSelectEvent, onShowOverflow }: Props) {
  const monthStart = startOfMonth(date);
  const gridStart = startOfWeek(monthStart);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i += 1) cells.push(addDays(gridStart, i));
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="grid grid-cols-7 border-b border-gray-200 bg-slate-50 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-600 sm:text-xs">
        {dayLabels.map((label) => (
          <div key={label} className="px-3 py-2 text-center">{label}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, idx) => {
          const inMonth = d.getMonth() === date.getMonth();
          const items = eventsForDay(d, events);
          const dayEvents = items.slice(0, 3);
          const more = Math.max(items.length - dayEvents.length, 0);
          const isToday = sameDay(d, new Date());
          const isWeekend = idx % 7 >= 5;
          const isEndOfWeek = (idx + 1) % 7 === 0;
          let backgroundClass = inMonth ? "bg-white" : "bg-slate-50 text-slate-400";
          if (inMonth && isWeekend) backgroundClass = "bg-slate-50";

          return (
            <div
              key={`${d.toISOString()}-${idx}`}
              className={`relative min-h-[140px] border-b border-r border-gray-200 p-3 text-xs transition-colors ${backgroundClass} hover:bg-sky-50 focus-within:bg-sky-50 ${isToday ? "ring-2 ring-inset ring-blue-500" : ""} ${isEndOfWeek ? "border-r-0" : ""}`}
            >
              <div className="flex items-start justify-between">
                <button
                  type="button"
                  aria-label={`Create event on ${d.toLocaleDateString()}`}
                  onClick={() => onSelectDay(d)}
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition ${isToday ? "bg-blue-600 text-white shadow" : inMonth ? "text-slate-700 hover:bg-blue-50" : "text-slate-400"}`}
                >
                  {d.getDate()}
                </button>
              </div>
              <div className="mt-3 flex flex-col gap-1">
                {dayEvents.map((ev) => (
                  <CalendarEventCard key={ev.id} event={ev} onClick={() => onSelectEvent(ev)} />
                ))}
                {more > 0 && (
                  <button
                    type="button"
                    onClick={() => onShowOverflow(d)}
                    className="text-left text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    +{more} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
