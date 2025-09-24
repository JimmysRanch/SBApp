'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase/client';

type Row = {
  id: number;
  start_time: string;
  end_time: string | null;
  status: string;
  pet_name: string | null;
  service_name: string | null;
};

type AppointmentWithParsed = Row & {
  start: Date;
  end: Date | null;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatStatus = (status: string) =>
  status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatTimeRange = (start: Date, end: Date | null) => {
  const formatter: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  const startLabel = start.toLocaleTimeString([], formatter);
  if (!end) return startLabel;
  const endLabel = end.toLocaleTimeString([], formatter);
  return `${startLabel} – ${endLabel}`;
};

export default function CalendarPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const { loading: authLoading, session, permissions } = useAuth();
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateKey(today), [today]);
  const [activeDayKey, setActiveDayKey] = useState<string>(todayKey);
  const weekDays = useMemo(() => {
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dayOfWeek = startOfToday.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfToday.setDate(startOfToday.getDate() + diff);
    const startTime = startOfToday.getTime();
    return Array.from({ length: 7 }, (_, index) => new Date(startTime + index * DAY_IN_MS));
  }, [today]);
  const weekDayKeys = useMemo(() => weekDays.map((day) => toDateKey(day)), [weekDays]);
  const weekBounds = useMemo(() => {
    if (weekDays.length === 0) {
      const fallback = new Date();
      const iso = fallback.toISOString();
      return { startIso: iso, endIso: iso };
    }

    const start = new Date(weekDays[0]);
    start.setHours(0, 0, 0, 0);
    const lastDay = new Date(weekDays[weekDays.length - 1]);
    lastDay.setHours(0, 0, 0, 0);
    lastDay.setDate(lastDay.getDate() + 1);

    return { startIso: start.toISOString(), endIso: lastDay.toISOString() };
  }, [weekDays]);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const load = useCallback(async () => {
    if (!session || !permissions.canManageCalendar) return;

    setLoading(true);
    setErr(null);

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id, start_time, end_time, status,
          pets ( name ),
          services ( name )
        `)
        .gte('start_time', weekBounds.startIso)
        .lt('start_time', weekBounds.endIso)
        .in('status', ['booked', 'checked_in', 'in_progress', 'completed'])
        .order('start_time', { ascending: true });

      if (error) throw error;

      const normalized: Row[] = (data ?? []).map((d: any) => ({
        id: d.id,
        start_time: d.start_time,
        end_time: d.end_time,
        status: d.status,
        pet_name: Array.isArray(d.pets) ? d.pets[0]?.name ?? null : d.pets?.name ?? null,
        service_name: Array.isArray(d.services) ? d.services[0]?.name ?? null : d.services?.name ?? null,
      }));

      setRows(normalized);
    } catch (error: any) {
      setErr(error?.message || 'Unable to load appointments');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [permissions.canManageCalendar, session, weekBounds.endIso, weekBounds.startIso]);

  const appointmentsByDay = useMemo(() => {
    const grouped = new Map<string, { date: Date; appointments: AppointmentWithParsed[] }>();

    rows.forEach((row) => {
      const start = new Date(row.start_time);
      const end = row.end_time ? new Date(row.end_time) : null;
      const key = toDateKey(start);
      const existing = grouped.get(key);
      const entry: AppointmentWithParsed = {
        ...row,
        start,
        end,
      };

      if (existing) {
        existing.appointments.push(entry);
      } else {
        grouped.set(key, {
          date: new Date(start.getFullYear(), start.getMonth(), start.getDate()),
          appointments: [entry],
        });
      }
    });

    grouped.forEach((value) => {
      value.appointments.sort((a, b) => a.start.getTime() - b.start.getTime());
    });

    return grouped;
  }, [rows]);

  const otherDayEntries = useMemo(() => {
    const weekKeySet = new Set(weekDayKeys);
    return Array.from(appointmentsByDay.entries())
      .filter(([key]) => !weekKeySet.has(key))
      .sort((a, b) => a[1].date.getTime() - b[1].date.getTime());
  }, [appointmentsByDay, weekDayKeys]);

  const handleDaySelect = useCallback((dayKey: string) => {
    setActiveDayKey(dayKey);
    const node = sectionRefs.current[dayKey];
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!session || !permissions.canManageCalendar) {
      setRows([]);
      setLoading(false);
      return;
    }
    void load();
  }, [authLoading, load, permissions.canManageCalendar, session]);

  if (authLoading) {
    return null;
  }

  if (!session) {
    return <div className="p-6">Please log in to view the calendar.</div>;
  }

  if (!permissions.canManageCalendar) {
    return (
      <div className="space-y-3 p-6">
        <h1 className="text-2xl font-semibold">Calendar Access</h1>
        <p className="text-sm text-white/80">
          You do not currently have permission to view the calendar. Please contact an administrator if you
          believe this is a mistake.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div className="px-6 py-10 text-sm text-white/70">Loading appointments…</div>;
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      {err && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-1">
        {weekDays.map((day) => {
          const dayKey = toDateKey(day);
          const count = appointmentsByDay.get(dayKey)?.appointments.length ?? 0;
          const isActive = activeDayKey === dayKey;
          const isToday = todayKey === dayKey;
          const weekdayLabel = day.toLocaleDateString(undefined, { weekday: 'short' });
          const fullDateLabel = day.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

          return (
            <button
              key={dayKey}
              type="button"
              onClick={() => handleDaySelect(dayKey)}
              className={`flex min-w-[140px] flex-col rounded-2xl border px-4 py-3 text-left transition hover:border-white/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                isActive ? 'border-white/50 bg-white/15 shadow-lg shadow-black/10' : 'border-white/10 bg-white/[0.03]'
              } ${isToday ? 'ring-1 ring-white/30' : ''}`}
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-white/60">{weekdayLabel}</span>
              <span className="mt-1 text-sm font-semibold text-white">{fullDateLabel}</span>
              <span className="mt-3 text-2xl font-semibold text-white">{count}</span>
              <span className="text-xs text-white/60">{count === 1 ? 'Appointment' : 'Appointments'}</span>
            </button>
          );
        })}
      </div>

      {!err && rows.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-8 text-center text-sm text-white/70">
          No appointments scheduled for this time range.
        </div>
      )}

      <div className="space-y-10">
        {weekDays.map((day) => {
          const dayKey = toDateKey(day);
          const appointments = appointmentsByDay.get(dayKey)?.appointments ?? [];
          const weekdayLabel = day.toLocaleDateString(undefined, { weekday: 'long' });
          const fullDateLabel = day.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

          return (
            <section
              key={dayKey}
              ref={(node) => {
                if (node) {
                  sectionRefs.current[dayKey] = node;
                } else {
                  delete sectionRefs.current[dayKey];
                }
              }}
              id={`day-${dayKey}`}
              className="space-y-4"
            >
              <h2 className="text-lg font-semibold text-white">
                {weekdayLabel}
                <span className="ml-2 text-sm font-normal text-white/60">{fullDateLabel}</span>
              </h2>

              {appointments.length === 0 && !err ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-6 text-sm text-white/60">
                  No appointments scheduled.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {appointments.map((appointment) => (
                    <article
                      key={appointment.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5 shadow-lg shadow-black/10"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-[0.95rem] font-semibold text-white">
                            {appointment.pet_name ?? 'Unknown pet'}
                          </p>
                          <p className="text-[0.8rem] text-white/70">
                            {appointment.service_name ?? 'Service'}
                          </p>
                        </div>
                        <div className="text-sm font-semibold text-white sm:text-right">
                          {formatTimeRange(appointment.start, appointment.end)}
                        </div>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1.5 text-[0.75rem] text-white/60">
                        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-2 py-0.5 font-semibold uppercase tracking-wide text-[0.7rem] text-white/80">
                          {formatStatus(appointment.status)}
                        </span>
                        <span className="text-[0.75rem] text-white/50">
                          {appointment.start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                          {appointment.end
                            ? ` • Ends ${appointment.end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
                            : ''}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          );
        })}

        {otherDayEntries.length > 0 && (
          <div className="space-y-10">
            {otherDayEntries.map(([key, value]) => {
              const weekdayLabel = value.date.toLocaleDateString(undefined, { weekday: 'long' });
              const fullDateLabel = value.date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

              return (
                <section key={key} className="space-y-4">
                  <h2 className="text-lg font-semibold text-white">
                    {weekdayLabel}
                    <span className="ml-2 text-sm font-normal text-white/60">{fullDateLabel}</span>
                  </h2>
                  <div className="space-y-2.5">
                    {value.appointments.map((appointment) => (
                      <article
                        key={appointment.id}
                        className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2.5 shadow-lg shadow-black/10"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-[0.95rem] font-semibold text-white">
                              {appointment.pet_name ?? 'Unknown pet'}
                            </p>
                            <p className="text-[0.8rem] text-white/70">
                              {appointment.service_name ?? 'Service'}
                            </p>
                          </div>
                          <div className="text-sm font-semibold text-white sm:text-right">
                            {formatTimeRange(appointment.start, appointment.end)}
                          </div>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1.5 text-[0.75rem] text-white/60">
                          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-2 py-0.5 font-semibold uppercase tracking-wide text-[0.7rem] text-white/80">
                            {formatStatus(appointment.status)}
                          </span>
                          <span className="text-[0.75rem] text-white/50">
                            {appointment.start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                            {appointment.end
                              ? ` • Ends ${appointment.end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
                              : ''}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
