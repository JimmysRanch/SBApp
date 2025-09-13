"use client";
import PageContainer from "@/components/PageContainer";
import Card from "@/components/Card";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import clsx from "clsx";

// Appointment type including joined pet and client names. The Supabase
// query uses `pets(name)` and `clients(full_name)` to join these fields
// via foreign keys on the appointments table.
type Appt = {
  id: string;
  start_time: string;
  service: string | null;
  status: string;
  pets: { name: string }[];
  clients: { full_name: string }[];
};

// Build a date key like `2024-01-05` for grouping appointments.
function dateKey(d: Date) {
  return d.toISOString().split("T")[0];
}

// Return all days displayed in the month grid. Includes days from the
// previous and next months to fill out the weeks.
function getCalendarDays(current: Date) {
  const startOfMonth = new Date(current.getFullYear(), current.getMonth(), 1);
  const endOfMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0);
  const start = new Date(startOfMonth);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(endOfMonth);
  end.setDate(end.getDate() + (6 - end.getDay()));
  const days: Date[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

/**
 * Calendar page showing appointments in a month view. Appointments are
 * loaded from the `appointments` table and grouped by day. Selecting a
 * day reveals its appointments below the calendar.
 */
export default function CalendarPage() {
  const [apptsByDate, setApptsByDate] = useState<Record<string, Appt[]>>({});
  const [current, setCurrent] = useState(new Date());
  const todayKey = dateKey(new Date());
  const [selected, setSelected] = useState<string>(todayKey);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, start_time, service, status, pets(name), clients(full_name)")
        .order("start_time");
      if (!error && data) {
        const map: Record<string, Appt[]> = {};
        (data as unknown as Appt[]).forEach((appt) => {
          const key = appt.start_time.slice(0, 10);
          map[key] = map[key] ? [...map[key], appt] : [appt];
        });
        setApptsByDate(map);
      }
    };
    fetchData();
  }, []);

  const days = getCalendarDays(current);
  const monthLabel = current.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <PageContainer>
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              className="rounded p-1 hover:bg-gray-100"
              onClick={() =>
                setCurrent(
                  new Date(current.getFullYear(), current.getMonth() - 1, 1)
                )
              }
              aria-label="Previous month"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold text-primary-dark">{monthLabel}</h1>
            <button
              className="rounded p-1 hover:bg-gray-100"
              onClick={() =>
                setCurrent(
                  new Date(current.getFullYear(), current.getMonth() + 1, 1)
                )
              }
              aria-label="Next month"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
          <button
            className="rounded border px-2 py-1 text-sm hover:bg-gray-100"
            onClick={() => {
              setCurrent(new Date());
              setSelected(todayKey);
            }}
          >
            Today
          </button>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center text-sm">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="font-medium">
              {d}
            </div>
          ))}
          {days.map((day) => {
            const key = dateKey(day);
            const appts = apptsByDate[key] || [];
            const isCurrentMonth = day.getMonth() === current.getMonth();
            const isToday = key === todayKey;
            const isSelected = key === selected;
            return (
              <div
                key={key}
                onClick={() => setSelected(key)}
                className={clsx(
                  "relative h-24 cursor-pointer rounded border p-1 text-left transition-colors hover:bg-secondary-green/40",
                  isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400",
                  isToday && "border-primary-light",
                  isSelected && "ring-2 ring-primary-light"
                )}
              >
                <div className="mb-1 flex justify-between text-xs">
                  <span>{day.getDate()}</span>
                  {appts.length > 0 && (
                    <span className="rounded bg-primary-light px-1 text-[10px] text-white">
                      {appts.length}
                    </span>
                  )}
                </div>
                {appts.slice(0, 2).map((a) => (
                  <div
                    key={a.id}
                    className="mb-1 truncate rounded bg-primary-light px-1 text-[10px] text-white"
                  >
                    {new Date(a.start_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    {a.pets?.[0]?.name ?? "Appt"}
                  </div>
                ))}
                {appts.length > 2 && (
                  <div className="text-[10px] text-primary-dark">
                    +{appts.length - 2} more
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {selected && (
          <div className="mt-6">
            <h2 className="mb-2 text-lg font-semibold">
              Appointments on {" "}
              {new Date(selected).toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h2>
            {apptsByDate[selected]?.length ? (
              <ul className="space-y-2">
                {apptsByDate[selected]!.map((a) => (
                  <li
                    key={a.id}
                    className="flex justify-between rounded border p-2 text-sm"
                  >
                    <div>
                      <div className="font-medium">
                        {a.pets?.[0]?.name ?? "-"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {a.clients?.[0]?.full_name ?? "-"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {a.service ?? "-"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div>
                        {new Date(a.start_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div
                        className={clsx(
                          "mt-1 inline-block rounded px-2 text-xs capitalize",
                          {
                            pending: "bg-yellow-100 text-yellow-800",
                            scheduled: "bg-blue-100 text-blue-800",
                            completed: "bg-green-100 text-green-800",
                            cancelled: "bg-red-100 text-red-800",
                          }[a.status] || "bg-gray-100 text-gray-800"
                        )}
                      >
                        {a.status}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No appointments.</p>
            )}
          </div>
        )}
      </Card>
    </PageContainer>
  );
}

