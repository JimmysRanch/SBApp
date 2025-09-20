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
  Completed: 'bg-brand-mint/15 text-brand-cream',
  Upcoming: 'bg-white/5 text-brand-cream',
  Cancelled: 'bg-brand-bubble/25 text-white',
  'In Progress': 'bg-primary/20 text-brand-cream',
  'Checked In': 'bg-brand-lavender/20 text-white'
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
    return <div className="text-brand-cream/70">Loading...</div>
  }

  if (appointments.length === 0) {
    return (
      <div className="rounded-3xl border border-white/8 bg-brand-onyx/60 p-6 text-brand-cream/70 shadow-[0_24px_60px_-40px_rgba(5,12,32,0.9)] backdrop-blur-xl">
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
      <div className="flex items-center justify-between text-brand-cream">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-brand-cream/60">Today</p>
          <h3 className="text-2xl font-semibold tracking-tight text-brand-cream drop-shadow-sm">{today}</h3>
        </div>
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-lg font-semibold text-brand-cream shadow-inner">
          {appointments.length}
        </span>
      </div>
      <ul className="space-y-3">
        {appointments.map((appt) => (
          <li
            key={appt.id}
            className="grid grid-cols-[auto,1fr,auto] items-center gap-4 rounded-3xl border border-white/8 bg-brand-onyx/75 px-5 py-4 text-brand-cream shadow-[0_26px_60px_-40px_rgba(5,12,32,0.9)] backdrop-blur"
          >
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5 text-xl text-brand-bubble">
              ●
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-cream">{appt.pet_name}</p>
              <p className="text-xs text-brand-cream/60">{appt.client_name}</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-brand-cream">{appt.time}</div>
              <span
                className={clsx(
                  'mt-2 inline-flex items-center justify-center rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide',
                  statusStyles[appt.status] ?? 'bg-white/5 text-brand-cream'
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
