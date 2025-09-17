"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CalendarGrid from "./components/CalendarGrid";
import WeekView from "./components/WeekView";
import DayView from "./components/DayView";
import EventDialog from "./components/EventDialog";
import DeleteConfirm from "./components/DeleteConfirm";
import { useCalendarStore } from "./state/calendarStore";
import { useCalendarEvents } from "./hooks/useCalendarEvents";
import { addDays, endOfDay, endOfWeek, startOfDay, startOfMonth, startOfWeek } from "./utils/date";
import type { CalendarEvent as ViewEvent } from "./components/CalendarEventCard";
import type { TCalendarEvent } from "@/lib/validation/calendar";
import { supabase } from "@/lib/supabaseClient";

const monthFormatter = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });
const dayFormatter = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
const weekStartFormatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const weekEndSameMonthFormatter = new Intl.DateTimeFormat(undefined, { day: "numeric" });
const weekEndDiffMonthFormatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const weekYearFormatter = new Intl.DateTimeFormat(undefined, { year: "numeric" });

const typeOptions: { value: "appointment" | "shift" | "timeOff" | ""; label: string }[] = [
  { value: "", label: "All types" },
  { value: "appointment", label: "Appointment" },
  { value: "shift", label: "Shift" },
  { value: "timeOff", label: "Time Off" },
];

type StaffOption = { id: string; label: string };

type Toast = { id: number; message: string; tone: "success" | "error" | "info" };

type View = "month" | "week" | "day";

type CalendarRange = { from: Date; to: Date };

function toDateInputValue(date: Date) {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
}

function computeRange(view: View, anchor: Date): CalendarRange {
  if (view === "day") {
    return { from: startOfDay(anchor), to: endOfDay(anchor) };
  }
  if (view === "week") {
    return { from: startOfWeek(anchor), to: endOfWeek(anchor) };
  }
  const first = startOfWeek(startOfMonth(anchor));
  const last = endOfWeek(addDays(first, 41));
  return { from: first, to: last };
}

function formatLabel(view: View, anchor: Date) {
  if (view === "day") return dayFormatter.format(anchor);
  if (view === "week") {
    const start = startOfWeek(anchor);
    const end = endOfWeek(anchor);
    const startText = weekStartFormatter.format(start);
    const endText = start.getMonth() === end.getMonth()
      ? weekEndSameMonthFormatter.format(end)
      : weekEndDiffMonthFormatter.format(end);
    return `${startText}–${endText}, ${weekYearFormatter.format(end)}`;
  }
  return monthFormatter.format(anchor);
}

function toViewEvent(event: TCalendarEvent): ViewEvent {
  return {
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    type: event.type,
    notes: event.notes,
    staffId: event.staffId ?? undefined,
    petId: event.petId ?? undefined,
    allDay: event.allDay ?? false,
  };
}

export default function CalendarPage() {
  const { view, setView, selectedDate, setDate, filters, setFilters } = useCalendarStore();
  const [search, setSearch] = useState("");
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [dialogInitial, setDialogInitial] = useState<any | undefined>(undefined);
  const [activeEvent, setActiveEvent] = useState<TCalendarEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TCalendarEvent | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("employees")
          .select("id,name")
          .order("name", { ascending: true });
        if (error) throw error;
        if (!cancelled) {
          const options = (data ?? []).map((item: any) => ({
            id: String(item.id),
            label: item.name || `#${item.id}`,
          }));
          setStaffOptions(options);
        }
      } catch (err) {
        if (!cancelled) {
          setStaffOptions([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const range = useMemo(() => computeRange(view, selectedDate), [view, selectedDate]);

  const { events, error, isLoading, create, update, remove, refresh } = useCalendarEvents(range.from, range.to, {
    staffId: filters.staffId,
    type: filters.type,
  });

  const filteredEvents = useMemo(() => {
    const list = (events as TCalendarEvent[]) ?? [];
    if (!search.trim()) return list;
    const query = search.trim().toLowerCase();
    return list.filter((event) => event.title.toLowerCase().includes(query));
  }, [events, search]);

  const viewEvents = useMemo(() => filteredEvents.map(toViewEvent), [filteredEvents]);

  const pushToast = (message: string, tone: Toast["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const handlePrev = () => {
    const next = new Date(selectedDate);
    if (view === "day") {
      next.setDate(next.getDate() - 1);
    } else if (view === "week") {
      next.setDate(next.getDate() - 7);
    } else {
      next.setMonth(next.getMonth() - 1);
    }
    setDate(next);
  };

  const handleNext = () => {
    const next = new Date(selectedDate);
    if (view === "day") {
      next.setDate(next.getDate() + 1);
    } else if (view === "week") {
      next.setDate(next.getDate() + 7);
    } else {
      next.setMonth(next.getMonth() + 1);
    }
    setDate(next);
  };

  const handleViewChange = (newView: View) => {
    setView(newView);
  };

  const handleToday = () => {
    setDate(new Date());
  };

  const openCreateDialog = (day?: Date) => {
    const base = day ? new Date(day) : new Date(selectedDate);
    setDate(base);
    base.setHours(0,0,0,0);
    const end = new Date(base);
    end.setHours(23,59,59,999);
    setDialogMode("create");
    setActiveEvent(null);
    setDialogInitial({
      title: "",
      type: "appointment",
      start: base.toISOString(),
      end: end.toISOString(),
      allDay: true,
      staffId: filters.staffId ?? "",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (eventId: string) => {
    const found = filteredEvents.find((ev) => ev.id === eventId);
    if (!found) return;
    setActiveEvent(found);
    setDialogMode("edit");
    setDialogInitial(found);
    setDialogOpen(true);
  };

  const handleDialogSubmit = async (payload: any) => {
    const body = {
      ...payload,
      start: (payload.start instanceof Date ? payload.start : new Date(payload.start)).toISOString(),
      end: (payload.end instanceof Date ? payload.end : new Date(payload.end)).toISOString(),
    };
    if (dialogMode === "create") {
      await create(body);
      pushToast("Created");
    } else if (dialogMode === "edit" && activeEvent) {
      await update(activeEvent.id, body);
      pushToast("Updated");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget.id);
      pushToast("Deleted");
    } catch (err: any) {
      pushToast(err?.message ?? "Could not delete", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  const label = useMemo(() => formatLabel(view, selectedDate), [view, selectedDate]);

  useEffect(() => {
    if (showDatePicker && dateInputRef.current) {
      dateInputRef.current.focus();
    }
  }, [showDatePicker]);

  return (
    <div className="flex h-full flex-col rounded-md border border-gray-200 bg-white shadow-sm">
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              className="rounded border border-gray-300 px-3 py-1 text-sm font-medium hover:bg-gray-50"
            >
              Prev
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDatePicker((prev) => !prev)}
                className="min-w-[180px] rounded border border-transparent px-2 py-1 text-sm font-semibold hover:border-gray-300"
              >
                {label}
              </button>
              {showDatePicker && (
                <input
                  ref={dateInputRef}
                  type="date"
                  className="absolute left-0 top-full mt-1 rounded border border-gray-300 bg-white px-2 py-1 text-sm shadow"
                  value={toDateInputValue(selectedDate)}
                  onChange={(event) => {
                    const next = new Date(event.target.value);
                    if (!Number.isNaN(next.valueOf())) {
                      setDate(next);
                    }
                    setShowDatePicker(false);
                  }}
                  onBlur={() => setShowDatePicker(false)}
                />
              )}
            </div>
            <button
              type="button"
              onClick={handleNext}
              className="rounded border border-gray-300 px-3 py-1 text-sm font-medium hover:bg-gray-50"
            >
              Next
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex overflow-hidden rounded border border-gray-300 text-sm">
              {(["month", "week", "day"] as View[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleViewChange(item)}
                  className={`px-3 py-1 font-medium ${view === item ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => openCreateDialog()}
              className="rounded bg-blue-600 px-3 py-1 text-sm font-semibold text-white hover:bg-blue-700"
            >
              New
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 bg-white px-4 py-2">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div>
            <label className="mr-2 font-medium" htmlFor="calendar-staff">Staff</label>
            <select
              id="calendar-staff"
              className="rounded border border-gray-300 px-2 py-1"
              value={filters.staffId ?? ""}
              onChange={(event) => setFilters({ ...filters, staffId: event.target.value || undefined })}
            >
              <option value="">All staff</option>
              {staffOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mr-2 font-medium" htmlFor="calendar-type">Type</label>
            <select
              id="calendar-type"
              className="rounded border border-gray-300 px-2 py-1"
              value={filters.type ?? ""}
              onChange={(event) => {
                const value = event.target.value as "appointment" | "shift" | "timeOff" | "";
                setFilters({ ...filters, type: value || undefined });
              }}
            >
              {typeOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleToday}
            className="rounded border border-gray-300 px-3 py-1 font-medium hover:bg-gray-50"
          >
            Today
          </button>
          <div className="relative flex-1 min-w-[180px]">
            <span className="sr-only">Search events</span>
            <input
              type="search"
              placeholder="Search titles"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-1"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading && (
          <div className="mb-2 text-sm text-gray-500">Loading…</div>
        )}
        {error && (
          <div className="mb-3 flex items-center justify-between rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <span>Could not load events.</span>
            <button
              type="button"
              onClick={refresh}
              className="rounded border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        )}

        {view === "month" && (
          <CalendarGrid
            date={selectedDate}
            events={viewEvents}
            onSelectDay={(day) => openCreateDialog(day)}
            onSelectEvent={(event) => openEditDialog(event.id)}
            onShowOverflow={(day) => {
              setDate(day);
              setView("day");
            }}
          />
        )}
        {view === "week" && (
          <WeekView
            date={selectedDate}
            events={viewEvents}
            onSelectEvent={(event) => openEditDialog(event.id)}
          />
        )}
        {view === "day" && (
          <DayView
            date={selectedDate}
            events={viewEvents}
            onSelectEvent={(event) => openEditDialog(event.id)}
          />
        )}
      </div>

      <EventDialog
        open={dialogOpen}
        mode={dialogMode}
        initial={dialogInitial}
        staffOptions={staffOptions}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleDialogSubmit}
        onDelete={dialogMode === "edit" ? () => {
          if (activeEvent) {
            setDialogOpen(false);
            setDeleteTarget(activeEvent);
          }
        } : undefined}
      />

      <DeleteConfirm
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      {toasts.length > 0 && (
        <div className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded px-4 py-2 text-sm font-medium text-white shadow ${toast.tone === "success" ? "bg-emerald-600" : toast.tone === "error" ? "bg-rose-600" : "bg-blue-600"}`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
