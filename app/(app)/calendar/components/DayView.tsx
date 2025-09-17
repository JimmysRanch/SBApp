"use client";
import CalendarEventCard, { type CalendarEvent } from "./CalendarEventCard";

export default function DayView({ date, events, onSelectEvent }: { date: Date; events: CalendarEvent[]; onSelectEvent: (e: CalendarEvent)=>void }) {
  const list = events
    .filter((ev)=>{
      const s = new Date(ev.start); const e = new Date(ev.end);
      const d0 = new Date(date); d0.setHours(0,0,0,0);
      const d1 = new Date(date); d1.setHours(23,59,59,999);
      return s <= d1 && e >= d0;
    })
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  return (
    <div className="bg-white rounded border p-3 space-y-2">
      {list.length===0 && <div className="text-sm text-gray-500">No events</div>}
      {list.map((ev)=>(
        <CalendarEventCard key={ev.id} event={ev} onClick={()=>onSelectEvent(ev)} />
      ))}
    </div>
  );
}
