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
  for (let i=0;i<42;i++) cells.push(addDays(gridStart, i));

  return (
    <div className="grid grid-cols-7 gap-px bg-gray-200 rounded overflow-hidden">
      {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d)=>(
        <div key={d} className="bg-white p-2 text-xs font-semibold">{d}</div>
      ))}
      {cells.map((d, idx) => {
        const inMonth = d.getMonth() === date.getMonth();
        const items = eventsForDay(d, events);
        const dayEvents = items.slice(0,3);
        const more = Math.max(items.length - dayEvents.length, 0);

        return (
          <div
            key={idx}
            className={`bg-white min-h-[100px] p-2 ${inMonth ? "" : "bg-gray-50 text-gray-400"} ${sameDay(d, new Date()) ? "border border-blue-500" : ""}`}
          >
            <div className="flex justify-between items-center">
              <button
                type="button"
                className="text-xs font-medium hover:underline"
                onClick={()=>onSelectDay(d)}
              >
                {d.getDate()}
              </button>
            </div>
            <div className="mt-2 space-y-1">
              {dayEvents.map((ev)=>(
                <div key={ev.id}>
                  <CalendarEventCard event={ev} onClick={()=>onSelectEvent(ev)} />
                </div>
              ))}
              {more>0 && (
                <button
                  type="button"
                  onClick={()=>onShowOverflow(d)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  +{more} more
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
