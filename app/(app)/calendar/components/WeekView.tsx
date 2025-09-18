"use client";
import CalendarEventCard, { type CalendarEvent } from "./CalendarEventCard";
import { addDays, startOfDay, endOfDay, startOfWeek } from "../utils/date";

const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: "short" });
const monthDayFormatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });

export default function WeekView({ date, events, onSelectEvent }: { date: Date; events: CalendarEvent[]; onSelectEvent: (e: CalendarEvent)=>void }) {
  const weekStart = startOfWeek(date);
  const days: Date[] = [];
  for (let i = 0; i < 7; i += 1) days.push(addDays(weekStart, i));

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="grid grid-cols-7 border-b border-gray-200 bg-slate-50 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-600 sm:text-xs">
        {days.map((day) => (
          <div key={`weekday-${day.toISOString()}`} className="px-3 py-2 text-center">
            <div>{weekdayFormatter.format(day)}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const rangeStart = startOfDay(day);
          const rangeEnd = endOfDay(day);
          const dayEvents = events
            .filter((event) => {
              const start = new Date(event.start);
              const end = new Date(event.end);
              return start <= rangeEnd && end >= rangeStart;
            })
            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

          return (
            <div
              key={`week-cell-${day.toISOString()}`}
              className={`min-h-[220px] border-b border-r border-gray-200 p-4 ${index === 6 ? "border-r-0" : ""}`}
            >
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {weekdayFormatter.format(day)}
                  </div>
                  <div className="text-sm font-semibold text-slate-800">{monthDayFormatter.format(day)}</div>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {dayEvents.length === 0 && (
                  <p className="rounded border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    No events scheduled.
                  </p>
                )}
                {dayEvents.map((event) => (
                  <CalendarEventCard key={event.id} event={event} onClick={() => onSelectEvent(event)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
