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
  Completed: 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/40',
  Upcoming: 'bg-sky-500/15 text-sky-200 ring-1 ring-sky-400/40',
  Cancelled: 'bg-rose-500/20 text-rose-100 ring-1 ring-rose-400/40',
  'In Progress': 'bg-amber-500/20 text-amber-100 ring-1 ring-amber-400/40',
  'Checked In': 'bg-primary/25 text-brand-cream ring-1 ring-primary/40'
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
    return <div className="text-slate-300">Loading...</div>
  }

  if (appointments.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-white/15 bg-slate-950/40 p-6 text-sm text-slate-400 backdrop-blur">
        No appointments today.
      </div>
    )
  }

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-brand-cream">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Today</p>
          <h3 className="text-2xl font-semibold tracking-tight drop-shadow">{today}</h3>
        </div>
        <span className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 text-lg font-semibold text-brand-cream shadow-[0_18px_40px_-30px_rgba(15,23,42,0.9)]">
          <span>{appointments.length}</span>
          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.3),transparent_60%)]" />
        </span>
      </div>
      <ul className="space-y-4">
        {appointments.map((appt) => (
          <li
            key={appt.id}
            className="relative grid grid-cols-[auto,1fr,auto] items-center gap-5 overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/60 px-5 py-4 text-brand-cream shadow-[0_28px_60px_-40px_rgba(15,23,42,0.9)] backdrop-blur"
          >
            <div className="relative grid h-14 w-14 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-bubble/40 via-primary/30 to-transparent text-2xl shadow-[0_18px_35px_-25px_rgba(34,211,238,0.7)]">
              🐶
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.3),transparent_70%)]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-cream">{appt.pet_name}</p>
              <p className="text-xs text-slate-400">{appt.client_name}</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-brand-cream">{appt.time}</div>
              <span
                className={clsx(
                  'mt-2 inline-flex items-center justify-center rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide transition',
                  statusStyles[appt.status] ?? 'bg-slate-500/20 text-slate-200 ring-1 ring-slate-400/40'
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
