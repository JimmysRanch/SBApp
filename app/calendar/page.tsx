"use client";
import PageContainer from "@/components/PageContainer";
import Card from "@/components/Card";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import clsx from "clsx";

type Appt = {
  id: string;
  start_time: string;
  service: string | null;
  status: string;
  groomer_name: string | null;
  pets: { name: string }[];
  clients: { full_name: string }[];
};

function dateKey(d: Date) {
  return d.toISOString().split("T")[0];
}

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

export default function CalendarPage() {
  const [appts, setAppts] = useState<Appt[]>([]);
  const [groomers, setGroomers] = useState<string[]>([]);
  const [groomer, setGroomer] = useState("All");
  const [view, setView] = useState<"day" | "week" | "month" | "list">("month");
  const [current, setCurrent] = useState(new Date());
  const todayKey = dateKey(new Date());
  const [selected, setSelected] = useState<string>(todayKey);

  useEffect(() => {
    const fetchData = async () => {
      const [apptsRes, groomersRes] = await Promise.all([
        supabase
          .from("appointments")
          .select(
            "id,start_time,service,status,groomer_name,pets(name),clients(full_name)"
          )
          .order("start_time"),
        supabase
          .from("employees")
          .select("name")
          .eq("active", true)
          .order("name"),
      ]);

      if (!apptsRes.error && apptsRes.data) {
        setAppts(apptsRes.data as unknown as Appt[]);
      }

      if (!groomersRes.error && groomersRes.data) {
        setGroomers(groomersRes.data.map((g: { name: string }) => g.name));
      }
    };
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    return groomer === "All"
      ? appts
      : appts.filter((a) => a.groomer_name === groomer);
  }, [appts, groomer]);

  const apptsByDate = useMemo(() => {
    const map: Record<string, Appt[]> = {};
    filtered.forEach((appt) => {
      const key = appt.start_time.slice(0, 10);
      map[key] = map[key] ? [...map[key], appt] : [appt];
    });
    return map;
  }, [filtered]);

  const listAppts = useMemo(
    () => [...filtered].sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [filtered]
  );

  const days = useMemo(() => getCalendarDays(current), [current]);

  const weekDays = useMemo(() => {
    const start = new Date(current);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [current]);

  const handleDayClick = (day: Date) => {
    const d = new Date(day);
    const key = dateKey(d);
    setSelected(key);
    setCurrent(d);
    setView("day");
  };

  const goToday = () => {
    const now = new Date();
    if (view === "month") {
      setCurrent(new Date(now.getFullYear(), now.getMonth(), 1));
    } else if (view === "week") {
      const start = new Date(now);
      start.setDate(start.getDate() - start.getDay());
      setCurrent(start);
      setSelected(dateKey(now));
    } else {
      setCurrent(now);
      setSelected(dateKey(now));
    }
  };

  const goPrev = () => {
    if (view === "month") {
      setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1));
    } else if (view === "week") {
      const d = new Date(current);
      d.setDate(d.getDate() - 7);
      setCurrent(d);
      setSelected(dateKey(d));
    } else if (view === "day") {
      const d = new Date(current);
      d.setDate(d.getDate() - 1);
      setCurrent(d);
      setSelected(dateKey(d));
    }
  };

  const goNext = () => {
    if (view === "month") {
      setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1));
    } else if (view === "week") {
      const d = new Date(current);
      d.setDate(d.getDate() + 7);
      setCurrent(d);
      setSelected(dateKey(d));
    } else if (view === "day") {
      const d = new Date(current);
      d.setDate(d.getDate() + 1);
      setCurrent(d);
      setSelected(dateKey(d));
    }
  };

  const label = () => {
    if (view === "month") {
      return current.toLocaleString("default", { month: "long", year: "numeric" });
    }
    if (view === "week") {
      const start = new Date(current);
      const end = new Date(current);
      end.setDate(end.getDate() + 6);
      return `${start.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })} - ${end.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
    }
    if (view === "day") {
      return current.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    return "";
  };

  const handleViewChange = (v: "day" | "week" | "month" | "list") => {
    setView(v);
    if (v === "month") {
      const d = new Date(selected);
      setCurrent(new Date(d.getFullYear(), d.getMonth(), 1));
    } else if (v === "week") {
      const d = new Date(selected);
      d.setDate(d.getDate() - d.getDay());
      setCurrent(d);
    } else if (v === "day") {
      const d = new Date(selected);
      setCurrent(d);
    }
  };

  const dayKey = dateKey(current);
  const dayAppts = apptsByDate[dayKey] || [];

  return (
    <PageContainer>
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="space-y-6 md:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex w-full gap-2 overflow-x-auto rounded-full bg-brand-bubble/10 p-1 text-sm sm:w-auto sm:overflow-visible sm:bg-transparent sm:p-0">
              {(["day", "week", "month", "list"] as const).map((v) => (
                <button
                  key={v}
                  className={clsx(
                    "flex-shrink-0 rounded-full px-3 py-1 text-sm font-semibold transition",
                    view === v
                      ? "bg-brand-bubble text-white shadow"
                      : "bg-white/60 text-primary-dark hover:bg-white"
                  )}
                  onClick={() => handleViewChange(v)}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
            <select
              className="w-full rounded-full border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-brand-bubble focus:ring-2 focus:ring-brand-bubble/30 sm:w-56"
              value={groomer}
              onChange={(e) => setGroomer(e.target.value)}
            >
              <option value="All">All Groomers</option>
              {groomers.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

        {view !== "list" && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between gap-3 sm:justify-start">
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-primary-dark shadow-sm transition hover:bg-white"
                onClick={goPrev}
                aria-label="Previous"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <h1 className="text-2xl font-bold text-primary-dark sm:text-3xl">{label()}</h1>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-primary-dark shadow-sm transition hover:bg-white"
                onClick={goNext}
                aria-label="Next"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
            <button
              className="w-full rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-primary-dark shadow-sm transition hover:bg-white sm:w-auto"
              onClick={goToday}
            >
              Today
            </button>
          </div>
        )}

        {view === "month" && (
          <div className="overflow-x-auto">
            <div className="grid min-w-[40rem] grid-cols-7 gap-2 text-center text-xs sm:text-sm">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="font-medium text-primary-dark">
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
                    onClick={() => handleDayClick(day)}
                    className={clsx(
                      "relative h-24 cursor-pointer rounded-xl border p-1 text-left transition-colors hover:bg-secondary-green/40",
                      isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400",
                      isToday && "border-primary-light",
                      isSelected && "ring-2 ring-primary-light"
                    )}
                  >
                    <div className="mb-1 flex justify-between text-[0.65rem] sm:text-xs">
                      <span>{day.getDate()}</span>
                      {appts.length > 0 && (
                        <span className="rounded bg-primary-light px-1 text-[0.6rem] text-white">
                          {appts.length}
                        </span>
                      )}
                    </div>
                    {appts.slice(0, 2).map((a) => (
                      <div
                        key={a.id}
                        className="mb-1 truncate rounded bg-primary-light/90 px-1 text-[0.6rem] text-white"
                      >
                        {new Date(a.start_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        {a.pets?.[0]?.name ?? "Appt"}
                      </div>
                    ))}
                    {appts.length > 2 && (
                      <div className="text-[0.6rem] text-primary-dark">
                        +{appts.length - 2} more
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === "week" && (
          <div className="overflow-x-auto">
            <div className="grid min-w-[40rem] grid-cols-7 gap-2 text-center text-xs sm:text-sm">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="font-medium text-primary-dark">
                  {d}
                </div>
              ))}
              {weekDays.map((day) => {
                const key = dateKey(day);
                const appts = apptsByDate[key] || [];
                const isToday = key === todayKey;
                const isSelected = key === selected;
                return (
                  <div
                    key={key}
                    onClick={() => handleDayClick(day)}
                    className={clsx(
                      "relative h-24 cursor-pointer rounded-xl border p-1 text-left transition-colors hover:bg-secondary-green/40",
                      "bg-white",
                      isToday && "border-primary-light",
                      isSelected && "ring-2 ring-primary-light"
                    )}
                  >
                    <div className="mb-1 flex justify-between text-[0.65rem] sm:text-xs">
                      <span>{day.getDate()}</span>
                      {appts.length > 0 && (
                        <span className="rounded bg-primary-light px-1 text-[0.6rem] text-white">
                          {appts.length}
                        </span>
                      )}
                    </div>
                    {appts.slice(0, 2).map((a) => (
                      <div
                        key={a.id}
                        className="mb-1 truncate rounded bg-primary-light/90 px-1 text-[0.6rem] text-white"
                      >
                        {new Date(a.start_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        {a.pets?.[0]?.name ?? "Appt"}
                      </div>
                    ))}
                    {appts.length > 2 && (
                      <div className="text-[0.6rem] text-primary-dark">
                        +{appts.length - 2} more
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === "day" && (
          <div className="mt-4 space-y-3">
            <h2 className="text-lg font-semibold text-primary-dark">
              Appointments on {" "}
              {current.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h2>
            {dayAppts.length ? (
              <ul className="space-y-3">
                {dayAppts.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white/80 p-3 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1 text-left">
                      <div className="font-semibold text-primary-dark">{a.pets?.[0]?.name ?? "-"}</div>
                      <div className="text-xs text-gray-500">
                        {a.clients?.[0]?.full_name ?? "-"}
                      </div>
                      <div className="text-xs text-gray-500">{a.service ?? "-"}</div>
                      <div className="text-xs text-gray-500">
                        {a.groomer_name ?? "-"}
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-2 text-xs font-semibold text-primary-dark sm:items-end sm:text-right">
                      <div className="text-sm">
                        {new Date(a.start_time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div
                        className={clsx(
                          "inline-flex items-center rounded-full px-3 py-1 text-xs capitalize",
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

        {view === "list" && (
          <div className="mt-4">
            {listAppts.length ? (
              <ul className="space-y-3">
                {listAppts.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white/80 p-3 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1 text-left">
                      <div className="font-semibold text-primary-dark">{a.pets?.[0]?.name ?? "-"}</div>
                      <div className="text-xs text-gray-500">
                        {a.clients?.[0]?.full_name ?? "-"}
                      </div>
                      <div className="text-xs text-gray-500">{a.service ?? "-"}</div>
                      <div className="text-xs text-gray-500">
                        {a.groomer_name ?? "-"}
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-2 text-xs font-semibold text-primary-dark sm:items-end sm:text-right">
                      <div className="text-sm">
                        {new Date(a.start_time).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div
                        className={clsx(
                          "inline-flex items-center rounded-full px-3 py-1 text-xs capitalize",
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
        <Card className="md:col-start-3">
          <h2 className="mb-4 text-lg font-semibold text-primary-dark">Upcoming Appointments</h2>
          <p className="text-sm text-gray-600">Select a date to view appointments.</p>
        </Card>
      </div>
    </PageContainer>
  );
}
