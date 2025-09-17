"use client";

import { useMemo } from "react";

type View = "day" | "week" | "month";

interface Props {
  currentDate: Date;
  view: View;
  onViewChange: (view: View) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const dow = d.getDay();
  const mondayIndex = (dow + 6) % 7;
  d.setDate(d.getDate() - mondayIndex);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(date: Date) {
  const start = startOfWeek(date);
  const d = new Date(start);
  d.setDate(start.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

export default function CalendarToolbar({ currentDate, view, onViewChange, onPrev, onNext, onToday }: Props) {
  const label = useMemo(() => {
    if (view === "day") {
      return currentDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    }
    if (view === "week") {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      return `${fmt(start)} – ${fmt(end)} ${end.getFullYear()}`;
    }
    return currentDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }, [currentDate, view]);

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <button onClick={onPrev} className="px-2 py-1 border rounded text-sm">Prev</button>
        <div className="font-semibold text-sm sm:text-base min-w-[140px] text-center">{label}</div>
        <button onClick={onNext} className="px-2 py-1 border rounded text-sm">Next</button>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onToday} className="px-2 py-1 border rounded text-sm">Today</button>
        <div className="inline-flex rounded border overflow-hidden text-sm">
          {(["day", "week", "month"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`px-3 py-1 ${view === v ? "bg-blue-600 text-white" : "bg-white text-gray-700"}`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
