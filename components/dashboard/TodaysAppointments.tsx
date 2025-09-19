"use client";
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import clsx from 'clsx'

interface Appointment {
  id: string
  time: string
  pet_name: string
  client_name: string
  status: string
}

const statusStyles: Record<string, string> = {
  Completed: 'bg-emerald-100 text-emerald-700',
  Upcoming: 'bg-slate-100 text-brand-charcoal',
  Cancelled: 'bg-rose-100 text-rose-600',
  'In Progress': 'bg-amber-100 text-amber-700',
  'Checked In': 'bg-primary/10 text-primary'
}

export default function TodaysAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Query the appointments scheduled for today. The Supabase table is expected
    // to have fields: id, scheduled_time, pet_name, client_name, status.
    const fetchAppointments = async () => {
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      const end = new Date()
      end.setHours(23, 59, 59, 999)

      const { data, error } = await supabase
        .from('appointments')
        .select('id, scheduled_time, pet_name, client_name, status')
        .gte('scheduled_time', start.toISOString())
        .lte('scheduled_time', end.toISOString())
        .order('scheduled_time', { ascending: true })

      if (!error && data) {
        setAppointments(
          data.map((row) => ({
            id: row.id as string,
            time: new Date(row.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            pet_name: row.pet_name,
            client_name: row.client_name,
            status: row.status,
          }))
        )
      }
      setLoading(false)
    }
    fetchAppointments()
  }, [])

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 text-slate-500">Loading today’s appointments…</div>
  }

  if (appointments.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 text-slate-500 shadow-inner">
        No appointments scheduled for today.
      </div>
    )
  }

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Today</p>
          <h3 className="text-2xl font-semibold text-brand-charcoal">{today}</h3>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-semibold text-brand-charcoal shadow-inner">
          {appointments.length}
        </span>
      </div>
      <ul className="space-y-3">
        {appointments.map((appt) => (
          <li
            key={appt.id}
            className="grid grid-cols-[auto,1fr,auto] items-center gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 text-brand-charcoal shadow-lg shadow-slate-200/60"
          >
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-2xl">
              🐶
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-charcoal">{appt.pet_name}</p>
              <p className="text-xs text-slate-500">{appt.client_name}</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-brand-charcoal">{appt.time}</div>
              <span
                className={clsx(
                  'mt-2 inline-flex items-center justify-center rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide',
                  statusStyles[appt.status] ?? 'bg-slate-100 text-brand-charcoal'
                )}
              >
                {appt.status}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
