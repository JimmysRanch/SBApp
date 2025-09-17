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
  Completed: 'bg-brand-mint/30 text-brand-navy',
  Upcoming: 'bg-white/40 text-brand-navy',
  Cancelled: 'bg-brand-bubble/40 text-white',
  'In Progress': 'bg-brand-sunshine/60 text-brand-navy',
  'Checked In': 'bg-brand-lavender/40 text-white'
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
    return <div className="text-white/80">Loading...</div>
  }

  if (appointments.length === 0) {
    return (
      <div className="rounded-3xl border border-white/30 bg-white/10 p-6 text-white/80 backdrop-blur-md">
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
    <div className="space-y-5">
      <div className="flex flex-col gap-3 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/70">Today</p>
          <h3 className="text-2xl font-semibold tracking-tight drop-shadow-sm">{today}</h3>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/25 text-base font-semibold text-white shadow-inner sm:h-12 sm:w-12 sm:text-lg">
          {appointments.length}
        </span>
      </div>
      <ul className="space-y-3">
        {appointments.map((appt) => (
          <li
            key={appt.id}
            className="flex flex-col gap-3 rounded-3xl bg-white/95 px-5 py-4 text-brand-navy shadow-lg shadow-primary/10 backdrop-blur sm:grid sm:grid-cols-[auto,1fr,auto] sm:items-center sm:gap-4"
          >
            <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-bubble/20 text-2xl">
              🐶
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-navy">{appt.pet_name}</p>
              <p className="text-xs text-brand-navy/70">{appt.client_name}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-brand-navy sm:flex-col sm:items-end sm:gap-3 sm:text-right">
              <div>{appt.time}</div>
              <span
                className={clsx(
                  'inline-flex items-center justify-center rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide',
                  statusStyles[appt.status] ?? 'bg-white/40 text-brand-navy'
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
