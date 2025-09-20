'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

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

const DAYS_BEFORE = 14;
const DAYS_AFTER = 14;

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
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { loading: authLoading, session, permissions } = useAuth();
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateKey(today), [today]);
  const todayStart = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), today.getDate()),
    [today],
  );
  const [activeDayKey, setActiveDayKey] = useState<string>(todayKey);
  const [emptyDayKey, setEmptyDayKey] = useState<string | null>(null);
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(todayStart);
    const dayOfWeek = startOfWeek.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(startOfWeek.getDate() + diff);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      return date;
    });
  }, [todayStart]);
  const weekDayKeys = useMemo(() => weekDays.map((day) => toDateKey(day)), [weekDays]);
  const timelineDays = useMemo(() => {
    const start = new Date(todayStart);
    start.setDate(start.getDate() - DAYS_BEFORE);
    return Array.from({ length: DAYS_BEFORE + DAYS_AFTER + 1 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [todayStart]);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const timelineButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const emptyDayDate = useMemo(() => {
    if (!emptyDayKey) return null;
    return timelineDays.find((day) => toDateKey(day) === emptyDayKey) ?? null;
  }, [emptyDayKey, timelineDays]);

  const load = useCallback(async () => {
    if (!session || !permissions.canManageCalendar) return;

    setLoading(true);
    setErr(null);

    try {
      const rangeStart = new Date(todayStart);
      rangeStart.setDate(rangeStart.getDate() - DAYS_BEFORE);
      const rangeEnd = new Date(todayStart);
      rangeEnd.setDate(rangeEnd.getDate() + DAYS_AFTER + 1);

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id, start_time, end_time, status,
          pets ( name ),
          services ( name )
        `)
        .gte('start_time', rangeStart.toISOString())
        .lt('start_time', rangeEnd.toISOString())
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
      setInitialLoadComplete(true);
    }
  }, [permissions.canManageCalendar, session, todayStart]);

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
    const button = timelineButtonRefs.current[activeDayKey];
    if (button) {
      button.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeDayKey]);

  useEffect(() => {
    const hasSection = Boolean(sectionRefs.current[activeDayKey]);
    const hasAppointments = appointmentsByDay.has(activeDayKey);
    if (!hasSection && !hasAppointments) {
      setEmptyDayKey(activeDayKey);
    } else {
      setEmptyDayKey(null);
    }
  }, [activeDayKey, appointmentsByDay]);

  useEffect(() => {
    if (authLoading) return;
    if (!session || !permissions.canManageCalendar) {
      setRows([]);
      setLoading(false);
      setInitialLoadComplete(true);
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

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
      {loading && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs uppercase tracking-wide text-white/50">
          Updating appointments…
        </div>
      )}
      {err && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {err}
        </div>
      )}

        <div className="flex gap-3 overflow-x-auto overflow-y-visible pb-2 pt-2">
          {timelineDays.map((day, index) => {
            const dayKey = toDateKey(day);
            const count = appointmentsByDay.get(dayKey)?.appointments.length ?? 0;
            const isActive = activeDayKey === dayKey;
            const isToday = todayKey === dayKey;
            const isPrimaryWeek = weekDayKeys.includes(dayKey);
            const offsetFromToday = index - DAYS_BEFORE;
            const isDistant = Math.abs(offsetFromToday) > 7;
            const weekdayLabel = day.toLocaleDateString(undefined, { weekday: 'short' });
            const fullDateLabel = day.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
            const buttonBaseClasses =
              "group relative flex min-w-[160px] flex-col overflow-hidden rounded-3xl border px-5 py-4 text-left transition-all duration-300 transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 before:absolute before:inset-x-6 before:-bottom-3 before:h-3 before:rounded-full before:bg-black/60 before:opacity-0 before:blur before:transition before:duration-300 before:content-['']";
            const buttonStateClasses = isActive
              ? 'border-white/70 bg-gradient-to-br from-white/30 via-white/[0.14] to-white/[0.05] shadow-[0_35px_65px_-28px_rgba(15,23,42,0.9)] scale-[1.02] before:-bottom-4 before:opacity-45'
              : isDistant
              ? 'border-white/5 bg-white/[0.015] shadow-[0_20px_50px_-32px_rgba(15,23,42,0.75)] hover:-translate-y-1.5 hover:border-white/40 hover:bg-white/[0.08] hover:shadow-[0_40px_70px_-32px_rgba(15,23,42,0.9)] group-hover:before:-bottom-4 group-hover:before:opacity-40'
              : !isPrimaryWeek
              ? 'border-white/8 bg-white/[0.025] shadow-[0_22px_55px_-32px_rgba(15,23,42,0.8)] hover:-translate-y-1.5 hover:border-white/40 hover:bg-white/[0.08] hover:shadow-[0_40px_70px_-32px_rgba(15,23,42,0.9)] group-hover:before:-bottom-4 group-hover:before:opacity-40'
              : 'border-white/10 bg-white/[0.04] shadow-[0_24px_60px_-30px_rgba(15,23,42,0.85)] hover:-translate-y-1.5 hover:border-white/40 hover:bg-white/[0.08] hover:shadow-[0_40px_70px_-32px_rgba(15,23,42,0.9)] group-hover:before:-bottom-4 group-hover:before:opacity-40';
            const weekdayTextClass = isActive
              ? 'text-slate-900/70'
              : isDistant
              ? 'text-white/50'
              : !isPrimaryWeek
              ? 'text-white/60'
              : 'text-white/60';
            const dateTextClass = isActive
              ? 'text-slate-900'
              : isDistant
              ? 'text-white/75'
              : !isPrimaryWeek
              ? 'text-white/80'
              : 'text-white';
            const countTextClass = isActive
              ? 'text-slate-900 drop-shadow-[0_8px_18px_rgba(15,23,42,0.25)]'
              : isDistant
              ? 'text-white/70'
              : !isPrimaryWeek
              ? 'text-white/80'
              : 'text-white';
            const appointmentsTextClass = isActive
              ? 'text-slate-900/70'
              : isDistant
              ? 'text-white/45'
              : !isPrimaryWeek
              ? 'text-white/55'
              : 'text-white/60';

            return (
              <button
                key={dayKey}
                ref={(node) => {
                  if (node) {
                    timelineButtonRefs.current[dayKey] = node;
                  } else {
                    delete timelineButtonRefs.current[dayKey];
                  }
                }}
                type="button"
                onClick={() => handleDaySelect(dayKey)}
                className={`${buttonBaseClasses} ${buttonStateClasses} ${isToday ? 'ring-1 ring-white/50' : ''}`}
                aria-pressed={isActive}
              >
                {isToday && (
                  <span
                    className={`absolute right-4 top-4 rounded-full border px-2 py-[2px] text-[0.6rem] font-semibold uppercase tracking-wide ${
                      isActive ? 'border-slate-900/20 bg-white/90 text-slate-900' : 'border-white/30 bg-white/10 text-white'
                    }`}
                  >
                    Today
                  </span>
                )}
                <span className={`text-xs font-semibold uppercase tracking-wide ${weekdayTextClass}`}>{weekdayLabel}</span>
                <span className={`mt-1 text-sm font-semibold ${dateTextClass}`}>{fullDateLabel}</span>
                <span className={`mt-3 text-2xl font-semibold ${countTextClass}`}>{count}</span>
                <span className={`text-xs ${appointmentsTextClass}`}>
                  {count === 1 ? 'Appointment' : 'Appointments'}
                </span>
              </button>
            );
          })}
        </div>

        {emptyDayDate && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
            No appointments scheduled for{' '}
            {emptyDayDate.toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
            .
          </div>
        )}

      {!err && initialLoadComplete && rows.length === 0 && (
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

              {appointments.length === 0 && initialLoadComplete && !err ? (
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
                  <section
                    key={key}
                    ref={(node) => {
                      if (node) {
                        sectionRefs.current[key] = node;
                      } else {
                        delete sectionRefs.current[key];
                      }
                    }}
                    id={`day-${key}`}
                    className="space-y-4"
                  >
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
