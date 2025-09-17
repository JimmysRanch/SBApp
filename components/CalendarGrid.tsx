"use client";

import { useMemo } from "react";

export interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  type: string;
}

interface Props {
  currentDate: Date;
  view: "week" | "month";
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const dow = d.getDay();
  const mondayIndex = (dow + 6) % 7;
  d.setDate(d.getDate() - mondayIndex);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isWithinDay(date: Date, start: Date, end: Date) {
  const s = new Date(start);
  const e = new Date(end);
  s.setHours(0, 0, 0, 0);
  e.setHours(23, 59, 59, 999);
  return date >= s && date <= e;
}

function formatTimeRange(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  return `${start.toLocaleTimeString([], opts)} – ${end.toLocaleTimeString([], opts)}`;
}

export default function CalendarGrid({ currentDate, view, events, onEventClick }: Props) {
  const data = useMemo(() => {
    if (view === "week") {
      const weekStart = startOfWeek(currentDate);
      const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
      return { weekDays: days };
    }
    const monthStart = startOfMonth(currentDate);
    const gridStart = startOfWeek(monthStart);
    const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
    return { monthCells: cells };
  }, [currentDate, view]);

  if (view === "week" && data.weekDays) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
        {data.weekDays.map((day) => {
          const dayEvents = events
            .filter((ev) => isWithinDay(day, ev.start, ev.end))
            .sort((a, b) => a.start.getTime() - b.start.getTime());
          return (
            <div key={day.toISOString()} className="border rounded-md p-3 bg-white">
              <div className="text-sm font-semibold mb-2">{day.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div>
              <div className="space-y-2">
                {dayEvents.length === 0 && <div className="text-xs text-gray-400">No appointments</div>}
                {dayEvents.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => onEventClick?.(ev)}
                    className="w-full text-left bg-blue-50 border border-blue-200 text-blue-800 rounded px-2 py-1 text-xs hover:bg-blue-100"
                  >
                    <div className="font-medium">{ev.title}</div>
                    <div>{formatTimeRange(ev.start, ev.end)}</div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (view === "month" && data.monthCells) {
    const month = currentDate.getMonth();
    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded overflow-hidden">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
          <div key={label} className="bg-white p-2 text-xs font-semibold">{label}</div>
        ))}
        {data.monthCells.map((day) => {
          const inMonth = day.getMonth() === month;
          const dayEvents = events
            .filter((ev) => isWithinDay(day, ev.start, ev.end))
            .sort((a, b) => a.start.getTime() - b.start.getTime());
          const visible = dayEvents.slice(0, 3);
          const more = dayEvents.length - visible.length;
          return (
            <div key={day.toISOString()} className={`bg-white min-h-[120px] p-2 ${inMonth ? "" : "bg-gray-50 text-gray-400"}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-medium">{day.getDate()}</div>
              </div>
              <div className="space-y-1">
                {visible.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => onEventClick?.(ev)}
                    className="block w-full text-left text-[11px] bg-blue-50 border border-blue-200 text-blue-800 rounded px-2 py-1 hover:bg-blue-100"
                  >
                    <div className="font-medium truncate">{ev.title}</div>
                    <div>{formatTimeRange(ev.start, ev.end)}</div>
                  </button>
                ))}
                {more > 0 && <div className="text-[11px] text-gray-500">+{more} more</div>}
                {dayEvents.length === 0 && <div className="text-[11px] text-gray-400">No appointments</div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}
