"use client";
import { addDays, endOfMonth, startOfMonth, startOfWeek, sameDay } from "../utils/date";
import CalendarEventCard, { type CalendarEvent } from "./CalendarEventCard";

export default function CalendarGrid({ date, events, onSelectDay, onSelectEvent }: {
  date: Date;
  events: CalendarEvent[];
  onSelectDay: (d: Date) => void;
  onSelectEvent: (e: CalendarEvent) => void;
}) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
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
        const dayEvents = events.filter(ev => {
          const s = new Date(ev.start); const e = new Date(ev.end);
          return sameDay(d, s) || (d >= new Date(s.setHours(0,0,0,0)) && d <= new Date(e.setHours(23,59,59,999)));
        }).slice(0,3);
        const more = events.filter(ev => {
          const s = new Date(ev.start); const e = new Date(ev.end);
          return sameDay(d, s) || (d >= new Date(s.setHours(0,0,0,0)) && d <= new Date(e.setHours(23,59,59,999)));
        }).length - dayEvents.length;

        return (
          <div key={idx} className={`bg-white min-h-[100px] p-2 ${inMonth ? "" : "bg-gray-50 text-gray-400"}`}>
            <div className="flex justify-between items-center">
              <button className="text-xs font-medium" onClick={()=>onSelectDay(d)}>{d.getDate()}</button>
            </div>
            <div className="mt-2 space-y-1">
              {dayEvents.map((ev)=>(
                <div key={ev.id}>
                  <CalendarEventCard event={ev} onClick={()=>onSelectEvent(ev)} />
                </div>
              ))}
              {more>0 && <div className="text-xs text-gray-500">+{more} more</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
