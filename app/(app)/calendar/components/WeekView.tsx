"use client";
import CalendarEventCard, { type CalendarEvent } from "./CalendarEventCard";
import { addDays, startOfWeek } from "../utils/date";

export default function WeekView({ date, events, onSelectEvent }: { date: Date; events: CalendarEvent[]; onSelectEvent: (e: CalendarEvent)=>void }) {
  const weekStart = startOfWeek(date);
  const days: Date[] = []; for (let i=0;i<7;i++) days.push(addDays(weekStart,i));
  return (
    <div className="grid grid-cols-7 gap-px bg-gray-200 rounded overflow-hidden">
      {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d)=>(
        <div key={d} className="bg-white p-2 text-xs font-semibold">{d}</div>
      ))}
      {days.map((d, idx)=>(
        <div key={idx} className="bg-white min-h-[200px] p-2">
          <div className="text-xs font-medium">{d.getMonth()+1}/{d.getDate()}</div>
          <div className="mt-2 space-y-1">
            {events
              .filter(ev=>{
                const s = new Date(ev.start); const e = new Date(ev.end);
                return d >= new Date(s.setHours(0,0,0,0)) && d <= new Date(e.setHours(23,59,59,999));
              })
              .sort((a,b)=> new Date(a.start).getTime() - new Date(b.start).getTime())
              .map(ev=>(
              <CalendarEventCard key={ev.id} event={ev} onClick={()=>onSelectEvent(ev)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
